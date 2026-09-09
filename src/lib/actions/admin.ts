"use server";

import { endOfDay, startOfDay } from "date-fns";
import { revalidatePath } from "next/cache";
import { fromZonedTime } from "date-fns-tz";
import { createClient } from "@/lib/supabase/server";
import { SALON_TIMEZONE } from "@/lib/business-info";
import type { AppointmentStatus, BusinessHour, Service } from "@/lib/database.types";

function revalidateAdmin() {
  revalidatePath("/admin");
  revalidatePath("/admin/appointments");
  revalidatePath("/admin/calendar");
}

// ---------- Appointments ----------

export async function listAppointments(range?: { fromISO: string; toISO: string }) {
  const supabase = await createClient();
  let query = supabase
    .from("appointments")
    .select("*, appointment_services(service:services(*))")
    .order("start_at", { ascending: true });

  if (range) {
    query = query.gte("start_at", range.fromISO).lte("start_at", range.toISO);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listAppointmentsForDay(date: Date) {
  return listAppointments({
    fromISO: startOfDay(date).toISOString(),
    toISO: endOfDay(date).toISOString(),
  });
}

export interface AdminCreateAppointmentInput {
  serviceIds: string[];
  startAtISO: string;
  guestName: string;
  guestPhone: string;
  guestEmail?: string;
  notes?: string;
}

export async function adminCreateAppointment(input: AdminCreateAppointmentInput) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("create_booking", {
    p_service_ids: input.serviceIds,
    p_start_at: input.startAtISO,
    p_guest_name: input.guestName,
    p_guest_phone: input.guestPhone,
    p_guest_email: input.guestEmail ?? null,
    p_notes: input.notes ?? null,
    p_booked_by: "owner",
  });

  if (error) {
    if (error.code === "23P01") {
      throw new Error("That time slot overlaps an existing appointment.");
    }
    throw new Error(error.message);
  }

  revalidateAdmin();
}

export async function updateAppointmentStatus(id: string, status: AppointmentStatus) {
  const supabase = await createClient();
  const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidateAdmin();
  revalidatePath("/my-appointments");
}

export async function rescheduleAppointment(id: string, startAtISO: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("appointments").update({ start_at: startAtISO }).eq("id", id);
  if (error) {
    if (error.code === "23P01") {
      throw new Error("That time slot overlaps an existing appointment.");
    }
    throw new Error(error.message);
  }
  revalidateAdmin();
  revalidatePath("/my-appointments");
}

// ---------- Services ----------

export async function listAllServices(): Promise<Service[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("services").select("*").order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export interface ServiceInput {
  name: string;
  category: string;
  price: number;
  durationMinutes: number;
  bufferMinutes: number;
  description?: string;
  /** Danish display copy. Blank falls back to the English above. */
  nameDa?: string;
  descriptionDa?: string;
  categoryDa?: string;
  active: boolean;
  sortOrder: number;
}

export async function createService(input: ServiceInput): Promise<Service> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("services")
    .insert({
      name: input.name,
      category: input.category,
      price: input.price,
      duration_minutes: input.durationMinutes,
      buffer_minutes: input.bufferMinutes,
      description: input.description || null,
      name_da: input.nameDa || null,
      description_da: input.descriptionDa || null,
      category_da: input.categoryDa || null,
      active: input.active,
      sort_order: input.sortOrder,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/admin/services");
  revalidatePath("/services");
  revalidatePath("/book");
  return data;
}

export async function updateService(id: string, input: ServiceInput) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("services")
    .update({
      name: input.name,
      category: input.category,
      price: input.price,
      duration_minutes: input.durationMinutes,
      buffer_minutes: input.bufferMinutes,
      description: input.description || null,
      name_da: input.nameDa || null,
      description_da: input.descriptionDa || null,
      category_da: input.categoryDa || null,
      active: input.active,
      sort_order: input.sortOrder,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/services");
  revalidatePath("/services");
  revalidatePath("/book");
}

export async function deleteService(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("services").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/services");
  revalidatePath("/services");
  revalidatePath("/book");
}

// ---------- Business hours ----------

export async function listBusinessHours(): Promise<BusinessHour[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("business_hours").select("*").order("day_of_week");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function updateBusinessHours(
  dayOfWeek: number,
  input: { openTime: string | null; closeTime: string | null; isClosed: boolean },
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("business_hours")
    .update({ open_time: input.openTime, close_time: input.closeTime, is_closed: input.isClosed })
    .eq("day_of_week", dayOfWeek);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/availability");
  revalidatePath("/book");
}

// ---------- Availability blocks (time off) ----------

export async function listAvailabilityBlocks() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("availability_blocks")
    .select("*")
    .gte("end_at", new Date().toISOString())
    .order("start_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

/** Blocked time within a window — the calendar needs past dates too, unlike the settings list. */
export async function listAvailabilityBlocksInRange(fromISO: string, toISO: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("availability_blocks")
    .select("*")
    .lt("start_at", toISO)
    .gt("end_at", fromISO)
    .order("start_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

/**
 * Blocks a slice of one day, e.g. 14:00–15:00 on the 12th. Times are entered as salon
 * wall-clock and converted here, so they stay correct whatever timezone the browser is in.
 */
export async function blockTimeOnDate(input: {
  date: string; // yyyy-MM-dd
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  reason?: string;
}) {
  const startAt = fromZonedTime(`${input.date}T${input.startTime}:00`, SALON_TIMEZONE);
  const endAt = fromZonedTime(`${input.date}T${input.endTime}:00`, SALON_TIMEZONE);

  if (endAt <= startAt) throw new Error("End time must be after start time.");

  const supabase = await createClient();
  const { error } = await supabase.from("availability_blocks").insert({
    start_at: startAt.toISOString(),
    end_at: endAt.toISOString(),
    reason: input.reason || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/availability");
  revalidatePath("/admin/calendar");
  revalidatePath("/book");
}

export async function createAvailabilityBlock(input: { startAtISO: string; endAtISO: string; reason?: string }) {
  const supabase = await createClient();
  const { error } = await supabase.from("availability_blocks").insert({
    start_at: input.startAtISO,
    end_at: input.endAtISO,
    reason: input.reason || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/availability");
  revalidatePath("/book");
}

export async function deleteAvailabilityBlock(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("availability_blocks").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/availability");
  revalidatePath("/admin/calendar");
  revalidatePath("/book");
}

// ---------- Recurring weekly time off ----------

export async function listRecurringTimeOff() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recurring_time_off")
    .select("*")
    .order("day_of_week")
    .order("start_time");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createRecurringTimeOff(input: {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  reason?: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("recurring_time_off").insert({
    day_of_week: input.dayOfWeek,
    start_time: input.startTime,
    end_time: input.endTime,
    reason: input.reason || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/availability");
  revalidatePath("/book");
}

export async function deleteRecurringTimeOff(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("recurring_time_off").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/availability");
  revalidatePath("/book");
}

// ---------- Testimonials ----------

export async function listTestimonials() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("testimonials")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export interface TestimonialInput {
  authorName: string;
  quote: string;
  rating: number | null;
  isPublished: boolean;
  sortOrder: number;
}

export async function createTestimonial(input: TestimonialInput) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("testimonials")
    .insert({
      author_name: input.authorName,
      quote: input.quote,
      rating: input.rating,
      is_published: input.isPublished,
      sort_order: input.sortOrder,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/admin/testimonials");
  return data;
}

export async function updateTestimonial(id: string, input: TestimonialInput) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("testimonials")
    .update({
      author_name: input.authorName,
      quote: input.quote,
      rating: input.rating,
      is_published: input.isPublished,
      sort_order: input.sortOrder,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/admin/testimonials");
}

export async function deleteTestimonial(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("testimonials").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/admin/testimonials");
}
