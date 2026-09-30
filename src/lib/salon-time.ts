import { addDays } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import type { Locale as DateFnsLocale } from "date-fns";
import { SALON_TIMEZONE } from "@/lib/business-info";

/**
 * Dates as they are in Høje Taastrup, whatever clock the code happens to run on.
 *
 * The server runs in UTC and a customer's phone could be set to anywhere, but an appointment at
 * 10:00 means 10:00 at the studio. Anything that shows a time, or decides what "today" is, should
 * go through here rather than date-fns's local-time `format` and `startOfDay`.
 */

/** "2026-09-30" — the calendar day at the studio. */
export function salonDayKey(date: Date): string {
  return formatInTimeZone(date, SALON_TIMEZONE, "yyyy-MM-dd");
}

/** The first and last instant of a studio calendar day, correct across daylight saving. */
export function salonDayRange(dayKey: string): { from: Date; to: Date } {
  return {
    from: fromZonedTime(`${dayKey}T00:00:00.000`, SALON_TIMEZONE),
    to: fromZonedTime(`${dayKey}T23:59:59.999`, SALON_TIMEZONE),
  };
}

/** The studio calendar day `offset` days after the one containing `date`. */
export function salonDayKeyOffset(date: Date, offset: number): string {
  // Anchored at noon so adding days never lands on the wrong side of midnight at a DST change.
  const noon = fromZonedTime(`${salonDayKey(date)}T12:00:00`, SALON_TIMEZONE);
  return salonDayKey(addDays(noon, offset));
}

export function formatSalon(
  date: Date | string,
  pattern: string,
  options?: { locale?: DateFnsLocale },
): string {
  return formatInTimeZone(new Date(date), SALON_TIMEZONE, pattern, options);
}
