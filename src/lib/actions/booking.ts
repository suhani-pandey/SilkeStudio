"use server";

import { endOfDay, startOfDay } from "date-fns";
import { formatInTimeZone, toZonedTime } from "date-fns-tz";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { computeAvailableSlots, type Interval } from "@/lib/availability";
import type { Service } from "@/lib/database.types";
import { SALON_TIMEZONE } from "@/lib/business-info";
import {
  customerConfirmationMessage,
  ownerAlertMessage,
  ownerAlertPhone,
  sendSms,
} from "@/lib/sms";
import { sendPushToOwners } from "@/lib/push";

const APPOINTMENT_SELECT = "*, appointment_services(service:services(*))";

export async function getActiveServices(): Promise<Service[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getPublishedTestimonials() {
  const supabase = await createClient();
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
}

export async function getBusinessHours() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("business_hours")
    .select("*")
    .order("day_of_week", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getAvailableSlots(
  serviceIds: string[],
  dateISO: string,
  excludeAppointmentId?: string,
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

  const [{ data: services, error: servicesError }, { data: hours }, { data: busyRows, error: busyError }] =
    await Promise.all([
      supabase.from("services").select("duration_minutes, buffer_minutes").in("id", serviceIds).eq("active", true),
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

  const durationMinutes = services.reduce((sum, s) => sum + s.duration_minutes, 0);
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
  guestEmail?: string;
  notes?: string;
}

export async function createBooking(input: CreateBookingInput): Promise<{ reference: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("create_booking", {
    p_service_ids: input.serviceIds,
    p_start_at: input.startAtISO,
    p_guest_name: input.guestName,
    p_guest_phone: input.guestPhone,
    p_guest_email: input.guestEmail ?? null,
    p_notes: input.notes ?? null,
    p_booked_by: "customer",
  });

  if (error) {
    if (error.code === "23P01") {
      throw new Error("That time slot was just booked by someone else. Please pick another time.");
    }
    throw new Error(error.message);
  }

  const reference = data?.[0]?.reference ?? "";
  await notifyNewBooking({
    guestName: input.guestName,
    guestPhone: input.guestPhone,
    serviceIds: input.serviceIds,
    startAtISO: input.startAtISO,
    reference,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/appointments");
  revalidatePath("/admin/calendar");
  return { reference };
}

/**
 * Texts the customer their confirmation and alerts the owner. Deliberately never throws: the
 * booking is already saved, so a failed text must not surface as a failed booking.
 */
async function notifyNewBooking(booking: {
  guestName: string;
  guestPhone: string;
  serviceIds: string[];
  startAtISO: string;
  reference: string;
}) {
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

    const ownerPhone = ownerAlertPhone();
    await Promise.all([
      sendSms(booking.guestPhone, customerConfirmationMessage(payload)),
      ownerPhone ? sendSms(ownerPhone, ownerAlertMessage(payload)) : Promise.resolve(false),
      sendPushToOwners("New booking", `${booking.guestName} — ${serviceNames}, ${when}`),
    ]);
  } catch (error) {
    console.error("Booking notifications failed", error);
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

export async function cancelOwnAppointment(appointmentId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("appointments")
    .update({ status: "cancelled" })
    .eq("id", appointmentId);

  if (error) throw new Error(error.message);
  revalidatePath("/my-appointments");
  revalidatePath("/admin");
}
