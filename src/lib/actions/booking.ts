"use server";

import { endOfDay, startOfDay } from "date-fns";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { computeAvailableSlots, type Interval } from "@/lib/availability";
import type { Service } from "@/lib/database.types";

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
  const date = new Date(dateISO);
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);
  const dayOfWeek = date.getDay();

  const [{ data: services, error: servicesError }, { data: hours }, { data: busyRows, error: busyError }] =
    await Promise.all([
      supabase.from("services").select("duration_minutes").in("id", serviceIds).eq("active", true),
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

  const busy: Interval[] = (busyRows ?? []).map((row) => ({
    start: new Date(row.busy_start),
    end: new Date(row.busy_end),
  }));

  const slots = computeAvailableSlots({
    date,
    openTime: hours?.open_time ?? null,
    closeTime: hours?.close_time ?? null,
    isClosed: hours?.is_closed ?? true,
    durationMinutes,
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

export async function createBooking(input: CreateBookingInput) {
  const supabase = await createClient();

  const { error } = await supabase.rpc("create_booking", {
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

  revalidatePath("/admin");
  revalidatePath("/admin/appointments");
  revalidatePath("/admin/calendar");
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
