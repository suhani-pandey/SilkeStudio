"use server";

import { revalidatePath } from "next/cache";
import { formatInTimeZone } from "date-fns-tz";
import { createClient } from "@/lib/supabase/server";
import { SALON_TIMEZONE } from "@/lib/business-info";
import { customerCancellationMessage, sendSms } from "@/lib/sms";
import { sendPushToOwners } from "@/lib/push";

export interface FoundBooking {
  reference: string;
  guestName: string;
  startAtISO: string;
  durationMinutes: number;
  totalPrice: number;
  status: "confirmed" | "cancelled" | "completed";
  services: string;
}

/**
 * Guests have no account, so their booking is invisible under the normal rules. The reference
 * code plus the phone number they booked with acts as the credential — a code on its own
 * reveals nothing.
 */
export async function findBooking(reference: string, phone: string): Promise<FoundBooking | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("find_booking", {
    p_reference: reference,
    p_phone: phone,
  });

  if (error) throw new Error(error.message);
  const row = data?.[0];
  if (!row) return null;

  return {
    reference: row.reference,
    guestName: row.guest_name,
    startAtISO: row.start_at,
    durationMinutes: row.duration_minutes,
    totalPrice: row.total_price,
    status: row.status,
    services: row.services ?? "",
  };
}

export async function cancelBookingByReference(reference: string, phone: string): Promise<boolean> {
  const supabase = await createClient();

  const booking = await findBooking(reference, phone);
  const { data, error } = await supabase.rpc("cancel_booking", {
    p_reference: reference,
    p_phone: phone,
  });

  if (error) throw new Error(error.message);
  if (!data) return false;

  if (booking) {
    const when = formatInTimeZone(
      new Date(booking.startAtISO),
      SALON_TIMEZONE,
      "EEEE d MMMM 'at' HH:mm",
    );
    // Best effort — the cancellation already succeeded, so a failed text must not undo it.
    await Promise.all([
      sendSms(
        phone,
        customerCancellationMessage({
          guestName: booking.guestName,
          services: booking.services,
          when,
          reference: booking.reference,
        }),
      ),
      sendPushToOwners("Booking cancelled", `${booking.guestName} — ${booking.services}, ${when}`),
    ]).catch((error) => console.error("Cancellation notifications failed", error));
  }

  revalidatePath("/admin");
  revalidatePath("/admin/appointments");
  revalidatePath("/admin/calendar");
  return true;
}
