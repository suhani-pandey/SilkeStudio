"use server";

import { endOfDay, startOfDay } from "date-fns";
import { formatInTimeZone, toZonedTime } from "date-fns-tz";
import { revalidatePath, unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { computeAvailableSlots, type Interval } from "@/lib/availability";
import type { Fulfilment, Service } from "@/lib/database.types";
import { SALON_TIMEZONE } from "@/lib/business-info";
import {
  customerConfirmationMessage,
  ownerAlertMessage,
  ownerAlertPhone,
  sendSms,
  isSmsConfigured,
} from "@/lib/sms";
import { sendPushToOwners } from "@/lib/push";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { confirmationEmail, isEmailConfigured, sendEmail } from "@/lib/email";
import {
  confirmationStatus,
  type ChannelOutcome,
  type ConfirmationSummary,
} from "@/lib/confirmation-status";
import { verifyTurnstile } from "@/lib/turnstile";
import { checkPhone, isEmailSyntaxValid } from "@/lib/contact-validation";
import { checkEmailDomain } from "@/lib/email-domain";
import { LATE_CANCELLATION_CODE, lateCancellationMessage } from "@/lib/booking-policy";
import { isUserFacingDbError, runAction, UserError, type ActionResult } from "@/lib/action-result";
import { createPublicClient } from "@/lib/supabase/public";

/** Returned when the chosen time went while the customer was filling in their details. */
const SLOT_TAKEN = "SLOT_TAKEN";

const APPOINTMENT_SELECT = "*, appointment_services(service:services(*))";

const loadActiveServices = unstable_cache(
  async (): Promise<Service[]> => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("active", true)
      .order("sort_order", { ascending: true });

    if (error) throw new Error(error.message);
    return data ?? [];
  },
  ["active-services"],
  { tags: [CACHE_TAGS.services], revalidate: 3600 },
);

export async function getActiveServices(): Promise<Service[]> {
  return loadActiveServices();
}

const loadPublishedTestimonials = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("testimonials")
      .select("*")
      .eq("is_published", true)
      .order("sort_order", { ascending: true });

    // Reviews are decorative: if the table is missing or unreadable, the home page should still
    // render rather than 500 on a section that may well be empty anyway.
    if (error) {
      console.error("Could not load testimonials", error.message);
      return [];
    }
    return data ?? [];
  },
  ["published-testimonials"],
  { tags: [CACHE_TAGS.testimonials], revalidate: 3600 },
);

export async function getPublishedTestimonials() {
  return loadPublishedTestimonials();
}

const loadBusinessHours = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("business_hours")
      .select("*")
      .order("day_of_week", { ascending: true });

    if (error) throw new Error(error.message);
    return data ?? [];
  },
  ["business-hours"],
  { tags: [CACHE_TAGS.businessHours], revalidate: 3600 },
);

const loadNailDesigns = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("nail_designs")
      .select("*")
      .eq("active", true)
      .order("sort_order", { ascending: true });

    // The catalogue is a shop window, not part of booking: if the table isn't there yet the rest
    // of the site must still work.
    if (error) {
      console.error("Could not load nail designs", error.message);
      return [];
    }
    return data ?? [];
  },
  ["nail-designs"],
  { tags: [CACHE_TAGS.nailDesigns], revalidate: 3600 },
);

export async function getNailDesigns() {
  return loadNailDesigns();
}

export async function getBusinessHours() {
  return loadBusinessHours();
}

export async function getAvailableSlots(
  serviceIds: string[],
  dateISO: string,
  excludeAppointmentId?: string,
  fulfilment: Fulfilment = "appointment",
): Promise<string[]> {
  if (serviceIds.length === 0) return [];

  const supabase = await createClient();
  // Work in the salon's timezone throughout: which calendar day this is, and which weekday's
  // opening hours apply, must both be decided there rather than on the server's clock.
  const date = new Date(dateISO);
  const dayKey = formatInTimeZone(date, SALON_TIMEZONE, "yyyy-MM-dd");
  const zoned = toZonedTime(date, SALON_TIMEZONE);
  const dayOfWeek = zoned.getDay();
  const dayStart = startOfDay(zoned);
  const dayEnd = endOfDay(zoned);

  const [
    { data: services, error: servicesError },
    { data: hours },
    { data: busyRows, error: busyError },
  ] = await Promise.all([
    // Selecting * rather than naming dropoff_minutes: on a database that hasn't had the
    // tailoring migration applied yet the column simply isn't there, and naming it would fail
    // the whole query and leave customers staring at a booking page with no times on it.
    supabase.from("services").select("*").in("id", serviceIds).eq("active", true),
    supabase.from("business_hours").select("*").eq("day_of_week", dayOfWeek).single(),
    // Taken slots come from a database function so guests (who can't read appointments) still
    // see accurate availability instead of every slot looking free.
    supabase.rpc("busy_intervals", {
      p_from: dayStart.toISOString(),
      p_to: dayEnd.toISOString(),
      p_exclude_appointment: excludeAppointmentId ?? null,
    }),
  ]);

  if (servicesError) throw new Error(servicesError.message);
  if (busyError) throw new Error(busyError.message);
  if (!services || services.length === 0) return [];

  // A drop-off only needs the hand-over slot — the sewing happens afterwards, not while the
  // customer stands there — so it books a fraction of the time the same job would take to wait for.
  const durationMinutes = services.reduce(
    (sum, s) => sum + (fulfilment === "dropoff" ? (s.dropoff_minutes ?? 15) : s.duration_minutes),
    0,
  );
  // One turnaround covers the whole visit, so take the longest of the chosen services.
  const bufferMinutes = Math.max(0, ...services.map((s) => s.buffer_minutes ?? 0));

  const busy: Interval[] = (busyRows ?? []).map((row) => ({
    start: new Date(row.busy_start),
    end: new Date(row.busy_end),
  }));

  const slots = computeAvailableSlots({
    dayKey,
    openTime: hours?.open_time ?? null,
    closeTime: hours?.close_time ?? null,
    isClosed: hours?.is_closed ?? true,
    durationMinutes,
    bufferMinutes,
    busy,
  });

  return slots.map((s) => s.toISOString());
}

export interface CreateBookingInput {
  serviceIds: string[];
  startAtISO: string;
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  notes?: string;
  /** Alterations only: whether the customer waits for the work or leaves the garment. */
  fulfilment?: Fulfilment;
  /** Bot-check token from the booking form; ignored while Turnstile isn't configured. */
  turnstileToken?: string;
}

export async function createBooking(
  input: CreateBookingInput,
): Promise<ActionResult<BookingCreated>> {
  return runAction(() => createBookingOrThrow(input));
}

export interface BookingCreated {
  reference: string;
  confirmation: ConfirmationSummary;
}

async function createBookingOrThrow(input: CreateBookingInput): Promise<BookingCreated> {
  if (!(await verifyTurnstile(input.turnstileToken))) {
    throw new UserError("We couldn't confirm you're not a bot. Please try again.");
  }

  // The form checks all of this as the customer types; this is where it's actually enforced.
  const guestName = input.guestName.trim();
  if (!guestName || guestName.length > 120) {
    throw new UserError("Please enter your name.");
  }

  const phone = checkPhone(input.guestPhone);
  if (!phone.valid) {
    throw new UserError("That phone number doesn't look right. Please check it and try again.");
  }

  const guestEmail = input.guestEmail?.trim() ?? "";
  if (!isEmailSyntaxValid(guestEmail)) {
    throw new UserError("Please enter a valid email address.");
  }
  const domain = await checkEmailDomain(guestEmail);
  if (!domain.ok) {
    throw new UserError(
      domain.reason === "disposable"
        ? "Please use your own email address rather than a temporary one."
        : "That email address can't receive mail. Please check it for typos.",
    );
  }

  const supabase = await createClient();

  const { data, error } = await supabase.rpc("create_booking", {
    p_service_ids: input.serviceIds,
    p_start_at: input.startAtISO,
    p_guest_name: guestName,
    // Stored in one international format, so the same customer always matches themselves.
    p_guest_phone: phone.e164,
    p_guest_email: guestEmail,
    p_notes: input.notes ?? null,
    p_booked_by: "customer",
    p_fulfilment: input.fulfilment ?? "appointment",
  });

  if (error) {
    if (error.code === "23P01") {
      throw new UserError(
        "That time slot was just booked by someone else. Please pick another time.",
        SLOT_TAKEN,
      );
    }
    // Booking limits and validation raised by the database are written for customers.
    if (isUserFacingDbError(error)) throw new UserError(error.message);
    throw new Error(error.message);
  }

  const reference = data?.[0]?.reference ?? "";
  const appointmentId = data?.[0]?.appointment_id;
  const outcome = await notifyNewBooking({
    guestName,
    guestPhone: phone.e164,
    guestEmail,
    serviceIds: input.serviceIds,
    startAtISO: input.startAtISO,
    reference,
    dropoff: input.fulfilment === "dropoff",
  });
  const status = confirmationStatus(outcome);

  // So the owner can see which customers weren't told. The booking stands either way, so a
  // failure to record this is logged rather than surfaced.
  if (appointmentId) {
    const { error: recordError } = await supabase.rpc("record_confirmation_status", {
      p_appointment_id: appointmentId,
      p_reference: reference,
      p_status: status,
    });
    if (recordError) console.error("Could not record confirmation status", recordError.message);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/appointments");
  revalidatePath("/admin/calendar");
  return {
    reference,
    confirmation: {
      status,
      email: outcome.email ? guestEmail : undefined,
      byText: outcome.sms === true,
    },
  };
}

/**
 * Texts the customer their confirmation and alerts the owner. Deliberately never throws: the
 * booking is already saved, so a failed text must not surface as a failed booking.
 */
/**
 * Tells the customer and the owner about a new booking.
 *
 * Returns how the customer's own channels went, so the booking screen can be honest about
 * whether a confirmation actually went out, and the owner can see which customers weren't told.
 * The owner's alerts are sent alongside but don't affect that answer.
 */
async function notifyNewBooking(booking: {
  guestName: string;
  guestPhone: string;
  guestEmail?: string;
  serviceIds: string[];
  startAtISO: string;
  reference: string;
  dropoff?: boolean;
}): Promise<ChannelOutcome> {
  const smsTried = isSmsConfigured() && Boolean(booking.guestPhone);
  const emailTried = isEmailConfigured() && Boolean(booking.guestEmail);

  try {
    const supabase = await createClient();
    const { data: services } = await supabase
      .from("services")
      .select("name, sort_order")
      .in("id", booking.serviceIds)
      .order("sort_order");

    const serviceNames = (services ?? []).map((s) => s.name).join(", ");
    const when = formatInTimeZone(
      new Date(booking.startAtISO),
      SALON_TIMEZONE,
      "EEEE d MMMM 'at' HH:mm",
    );

    const payload = {
      guestName: booking.guestName,
      guestPhone: booking.guestPhone,
      services: serviceNames,
      when,
      reference: booking.reference,
    };

    const email = emailTried ? confirmationEmail({ ...payload, dropoff: booking.dropoff }) : null;
    const ownerPhone = ownerAlertPhone();

    const [smsSent, emailSent] = await Promise.all([
      smsTried ? sendSms(booking.guestPhone, customerConfirmationMessage(payload)) : null,
      email && booking.guestEmail ? sendEmail({ to: booking.guestEmail, ...email }) : null,
      ownerPhone ? sendSms(ownerPhone, ownerAlertMessage(payload)) : null,
      sendPushToOwners("New booking", `${booking.guestName} — ${serviceNames}, ${when}`),
    ]);

    return { sms: smsSent, email: emailSent };
  } catch (error) {
    console.error("Booking notifications failed", error);
    // Whatever was tried didn't complete, so it counts as failed rather than not attempted.
    return { sms: smsTried ? false : null, email: emailTried ? false : null };
  }
}

export async function getUpcomingAppointmentsForCustomer() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("appointments")
    .select(APPOINTMENT_SELECT)
    .eq("customer_id", user.id)
    .gte("start_at", new Date().toISOString())
    .neq("status", "cancelled")
    .order("start_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function cancelOwnAppointment(appointmentId: string): Promise<ActionResult> {
  return runAction(async () => {
    await cancelOwnAppointmentOrThrow(appointmentId);
    return null;
  });
}

async function cancelOwnAppointmentOrThrow(appointmentId: string) {
  const supabase = await createClient();
  // Customers can't update bookings directly any more — the database function checks it's
  // theirs, that it's still active, and that it's outside the 24-hour window.
  const { error } = await supabase.rpc("cancel_own_appointment", {
    p_appointment_id: appointmentId,
  });

  if (error) {
    if (error.code === LATE_CANCELLATION_CODE) throw new UserError(lateCancellationMessage());
    if (isUserFacingDbError(error)) throw new UserError(error.message);
    throw new Error(error.message);
  }
  revalidatePath("/my-appointments");
  revalidatePath("/admin");
}
