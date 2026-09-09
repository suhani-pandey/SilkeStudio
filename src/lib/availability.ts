import { addMinutes, isBefore } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import { SALON_TIMEZONE } from "@/lib/business-info";

export interface Interval {
  start: Date;
  end: Date;
}

export interface ComputeSlotsOptions {
  /** The calendar day slots are being computed for, as "yyyy-MM-dd" in the salon's timezone. */
  dayKey: string;
  openTime: string | null; // "HH:mm"
  closeTime: string | null; // "HH:mm"
  isClosed: boolean;
  /** Treatment time the customer is booking. */
  durationMinutes: number;
  /** Turnaround time after the treatment. Blocks the calendar but isn't offered to the customer. */
  bufferMinutes?: number;
  /** Existing appointments + owner time off that overlap this day. */
  busy: Interval[];
  slotIncrementMinutes?: number;
  /** Slots before this instant are excluded (defaults to now, for same-day booking). */
  now?: Date;
}

/**
 * Opening hours are wall-clock times in the salon's town ("10:00" means 10am in Høje Taastrup).
 * Anchor them to that timezone rather than the server's — hosting runs in UTC, which would
 * otherwise shift every slot by an hour or two depending on the season.
 */
function salonTimeToInstant(dayKey: string, time: string): Date {
  return fromZonedTime(`${dayKey}T${time.slice(0, 5)}:00`, SALON_TIMEZONE);
}

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return isBefore(aStart, bEnd) && isBefore(bStart, aEnd);
}

/**
 * Pure slot-computation shared by the customer booking flow and the owner's manual booking
 * form, so the two never disagree about what counts as available.
 */
export function computeAvailableSlots(opts: ComputeSlotsOptions): Date[] {
  const {
    dayKey,
    openTime,
    closeTime,
    isClosed,
    durationMinutes,
    bufferMinutes = 0,
    busy,
    slotIncrementMinutes = 15,
    now = new Date(),
  } = opts;

  if (isClosed || !openTime || !closeTime) return [];

  const dayOpen = salonTimeToInstant(dayKey, openTime);
  const dayClose = salonTimeToInstant(dayKey, closeTime);

  const slots: Date[] = [];
  let cursor = dayOpen;

  while (isBefore(cursor, dayClose)) {
    // The treatment must finish by closing time; the turnaround after it may run past.
    const treatmentEnd = addMinutes(cursor, durationMinutes);
    const blockedUntil = addMinutes(treatmentEnd, bufferMinutes);
    const fitsBeforeClose = !isBefore(dayClose, treatmentEnd);
    const isPast = isBefore(cursor, now);
    const isBusy = busy.some((b) => overlaps(cursor, blockedUntil, b.start, b.end));

    if (fitsBeforeClose && !isPast && !isBusy) {
      slots.push(cursor);
    }

    cursor = addMinutes(cursor, slotIncrementMinutes);
  }

  return slots;
}
