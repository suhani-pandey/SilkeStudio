import { NextResponse, type NextRequest } from "next/server";
import { addDays } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { SALON_TIMEZONE } from "@/lib/business-info";
import { createAdminClient } from "@/lib/supabase/admin";
import { reminderMessage, sendSms } from "@/lib/sms";
import { reminderEmail, sendEmail } from "@/lib/email";

/**
 * Daily maintenance, run once each evening by the scheduler (see vercel.json):
 *
 *  1. Tomorrow's customers get a reminder — the cheapest defence a one-person studio has against
 *     no-shows.
 *  2. Appointments past the retention period lose the details that identify a person.
 *
 * Needs SUPABASE_SERVICE_ROLE_KEY (it acts on every booking, with no user behind it) and
 * CRON_SECRET, which Vercel sends as a bearer token so nobody else can trigger it.
 */
export const dynamic = "force-dynamic";

const RETENTION_MONTHS = 24;

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is not set" }, { status: 503 });
  }

  // "Tomorrow" is a calendar day in Høje Taastrup, not in the server's UTC.
  const tomorrow = formatInTimeZone(addDays(new Date(), 1), SALON_TIMEZONE, "yyyy-MM-dd");
  const from = fromZonedTime(`${tomorrow}T00:00:00`, SALON_TIMEZONE).toISOString();
  const to = fromZonedTime(`${tomorrow}T23:59:59`, SALON_TIMEZONE).toISOString();

  const { data: due, error } = await supabase
    .from("appointments")
    .select(
      "id, guest_name, guest_phone, guest_email, start_at, fulfilment, appointment_services(service:services(name))",
    )
    .eq("status", "confirmed")
    .is("reminder_sent_at", null)
    .gte("start_at", from)
    .lte("start_at", to);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let reminded = 0;
  for (const appointment of due ?? []) {
    const services =
      appointment.appointment_services
        ?.map((row) => row.service?.name)
        .filter(Boolean)
        .join(", ") || "your appointment";
    const when = formatInTimeZone(
      new Date(appointment.start_at),
      SALON_TIMEZONE,
      "EEEE d MMMM 'at' HH:mm",
    );
    const dropoff = appointment.fulfilment === "dropoff";

    const email = appointment.guest_email
      ? reminderEmail({ guestName: appointment.guest_name, services, when, reference: "", dropoff })
      : null;

    const [smsSent, emailSent] = await Promise.all([
      appointment.guest_phone
        ? sendSms(appointment.guest_phone, reminderMessage({ services, when }))
        : Promise.resolve(false),
      email && appointment.guest_email
        ? sendEmail({ to: appointment.guest_email, ...email })
        : Promise.resolve(false),
    ]);

    // Only marked once something actually went out. If SMS and email are both still switched
    // off, nothing is marked, and the reminder goes out on the first run after one is enabled.
    if (smsSent || emailSent) {
      await supabase
        .from("appointments")
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq("id", appointment.id);
      reminded += 1;
    }
  }

  const { data: anonymised, error: retentionError } = await supabase.rpc(
    "anonymise_old_appointments",
    { p_months: RETENTION_MONTHS },
  );
  if (retentionError) console.error("Retention job failed", retentionError.message);

  return NextResponse.json({
    date: tomorrow,
    due: due?.length ?? 0,
    reminded,
    anonymised: anonymised ?? 0,
  });
}
