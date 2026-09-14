import "server-only";

import { businessInfo } from "@/lib/business-info";

/**
 * SMS via GatewayAPI (gatewayapi.com) — a Danish provider, so messages to Danish numbers are
 * cheap and can be sent from the salon's name rather than a number.
 *
 * Sending stays switched off until GATEWAYAPI_TOKEN is set, so nothing costs money before the
 * account exists. Failures never break a booking: a customer who booked successfully must not
 * see an error because a text didn't go out.
 */
const API_URL = "https://gatewayapi.com/rest/mtsms";

/** Max 11 characters, letters and digits — GatewayAPI rejects longer sender names. */
const SENDER = "SilkeStudio";

export function isSmsConfigured(): boolean {
  return Boolean(process.env.GATEWAYAPI_TOKEN);
}

/**
 * GatewayAPI wants full international format without "+" or spaces. Danish mobile numbers are
 * 8 digits, so a bare local number gets the 45 country code.
 */
export function toMsisdn(phone: string): string | null {
  const digits = phone.replace(/[^0-9]/g, "");
  if (!digits) return null;
  if (digits.startsWith("00")) return digits.slice(2);
  if (digits.length === 8) return `45${digits}`;
  return digits;
}

export async function sendSms(phone: string, message: string): Promise<boolean> {
  const token = process.env.GATEWAYAPI_TOKEN;
  if (!token) return false;

  const msisdn = toMsisdn(phone);
  if (!msisdn) return false;

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${token}`,
      },
      body: JSON.stringify({
        sender: SENDER,
        message,
        recipients: [{ msisdn: Number(msisdn) }],
      }),
    });

    if (!response.ok) {
      console.error("SMS failed", response.status, await response.text().catch(() => ""));
      return false;
    }
    return true;
  } catch (error) {
    console.error("SMS request failed", error);
    return false;
  }
}

/** The owner's mobile, for new-booking alerts. */
export function ownerAlertPhone(): string | null {
  return process.env.SALON_OWNER_PHONE || null;
}

interface BookingMessageInput {
  guestName: string;
  services: string;
  when: string;
  reference: string;
  guestPhone?: string;
}

export function customerConfirmationMessage({ services, when, reference }: BookingMessageInput): string {
  return [
    `Hi! Your ${businessInfo.name} booking is confirmed.`,
    `${services}`,
    `${when}`,
    `Booking code: ${reference}`,
    `Manage or cancel: ${bookingLookupUrl()}`,
  ].join("\n");
}

export function ownerAlertMessage({ guestName, services, when, guestPhone }: BookingMessageInput): string {
  return [`New booking: ${guestName}`, services, when, guestPhone ?? ""].filter(Boolean).join("\n");
}

export function customerCancellationMessage({ services, when }: BookingMessageInput): string {
  return `Your ${businessInfo.name} appointment (${services}, ${when}) has been cancelled. Call ${businessInfo.phone} to rebook.`;
}

export function readyForCollectionMessage({
  services,
  readyFrom,
}: {
  services: string;
  readyFrom: string;
}): string {
  return [
    `Your ${services} is ready to collect from ${readyFrom}.`,
    `${businessInfo.name}, ${businessInfo.address.line1}`,
    `Call ${businessInfo.phone} if you'd like to arrange a time.`,
  ].join("\n");
}

export function bookingLookupUrl(): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "";
  return `${base}/booking`;
}
