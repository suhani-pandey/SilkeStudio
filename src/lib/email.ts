import "server-only";

import { businessInfo } from "@/lib/business-info";
import { bookingLookupUrl } from "@/lib/sms";
import { escapeHtml } from "@/lib/escape-html";

/**
 * Email via Resend (resend.com). Like SMS, it stays switched off until RESEND_API_KEY is set, and
 * a failure never breaks a booking — a customer who booked successfully must not see an error
 * because an email didn't go out.
 *
 * EMAIL_FROM must be an address on a domain verified in Resend, e.g.
 * "Silke Studio <booking@silkestudio.dk>".
 */
const API_URL = "https://api.resend.com/emails";

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

export async function sendEmail(message: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from || !message.to) return false;

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        from,
        to: [message.to],
        subject: message.subject,
        text: message.text,
        html: message.html,
      }),
    });
    if (!response.ok) {
      console.error("Email failed", response.status, await response.text().catch(() => ""));
      return false;
    }
    return true;
  } catch (error) {
    console.error("Email request failed", error);
    return false;
  }
}

/** Shared frame so every email looks like it came from the same place. */
function layout(title: string, lines: string[]): string {
  const body = lines.map((line) => `<p style="margin:0 0 12px">${line}</p>`).join("");
  return `<!doctype html><html><body style="margin:0;background:#faf6f1;font-family:system-ui,sans-serif;color:#2e2622">
<div style="max-width:520px;margin:0 auto;padding:32px 24px">
<p style="margin:0 0 24px;font-size:13px;letter-spacing:3px;color:#9a6237">SILKE STUDIO</p>
<h1 style="margin:0 0 20px;font-size:22px;font-weight:600">${title}</h1>
${body}
<p style="margin:28px 0 0;font-size:13px;color:#6b5f56">${escapeHtml(businessInfo.address.line1)}, ${escapeHtml(businessInfo.address.line2)} · ${escapeHtml(businessInfo.phone)}</p>
</div></body></html>`;
}

interface BookingEmail {
  guestName: string;
  services: string;
  when: string;
  reference: string;
  dropoff?: boolean;
}

export function confirmationEmail(b: BookingEmail) {
  const first = escapeHtml(b.guestName.split(" ")[0] ?? b.guestName);
  const what = b.dropoff ? `Drop-off: ${b.services}` : b.services;
  return {
    subject: `Booking confirmed — ${b.when}`,
    text: [
      `Hi ${b.guestName.split(" ")[0]}, you're booked in.`,
      what,
      b.when,
      `Booking code: ${b.reference}`,
      `Change or cancel: ${bookingLookupUrl()}`,
    ].join("\n"),
    html: layout("You're booked in", [
      `Hi ${first}, your booking is confirmed.`,
      `<strong>${escapeHtml(what)}</strong><br>${escapeHtml(b.when)}`,
      `Booking code: <strong style="letter-spacing:2px">${escapeHtml(b.reference)}</strong>`,
      `Need to change or cancel? <a href="${bookingLookupUrl()}" style="color:#ad5238">Manage your booking</a> with your code and phone number.`,
    ]),
  };
}

export function reminderEmail(b: BookingEmail) {
  const first = escapeHtml(b.guestName.split(" ")[0] ?? b.guestName);
  const what = b.dropoff ? `Drop-off: ${b.services}` : b.services;
  return {
    subject: `See you tomorrow — ${b.when}`,
    text: [
      `Hi ${b.guestName.split(" ")[0]}, a reminder of your booking tomorrow.`,
      what,
      b.when,
      `Can't make it? Cancel here so someone else can have the slot: ${bookingLookupUrl()}`,
    ].join("\n"),
    html: layout("See you tomorrow", [
      `Hi ${first}, a quick reminder of your booking.`,
      `<strong>${escapeHtml(what)}</strong><br>${escapeHtml(b.when)}`,
      `Can't make it? <a href="${bookingLookupUrl()}" style="color:#ad5238">Cancel here</a> so someone else can have the slot.`,
    ]),
  };
}
