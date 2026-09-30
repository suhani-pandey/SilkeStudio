import { businessInfo } from "@/lib/business-info";

/** Online cancellation closes this many hours before the appointment. Enforced in the database. */
export const CANCELLATION_NOTICE_HOURS = 24;

/** SQLSTATE the database raises when a cancellation arrives inside the notice period. */
export const LATE_CANCELLATION_CODE = "P0024";

export function lateCancellationMessage(): string {
  return `Cancellations within ${CANCELLATION_NOTICE_HOURS} hours of the appointment have to be made by phone. Please call ${businessInfo.phone}.`;
}

/** True while a booking can still be cancelled online. */
export function canCancelOnline(startAtISO: string, now: Date = new Date()): boolean {
  return new Date(startAtISO).getTime() - now.getTime() > CANCELLATION_NOTICE_HOURS * 3_600_000;
}
