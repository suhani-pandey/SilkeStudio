import { addMinutes, isBefore, setHours, setMinutes, setSeconds, setMilliseconds } from "date-fns";

export interface Interval {
  start: Date;
  end: Date;
}

export interface ComputeSlotsOptions {
  /** The calendar day slots are being computed for (time-of-day is ignored). */
  date: Date;
  openTime: string | null; // "HH:mm"
  closeTime: string | null; // "HH:mm"
  isClosed: boolean;
  durationMinutes: number;
  /** Existing appointments + owner time-off blocks that overlap this day. */
  busy: Interval[];
  slotIncrementMinutes?: number;
  /** Slots before this instant are excluded (defaults to now, for same-day booking). */
  now?: Date;
}

function timeToDate(date: Date, time: string): Date {
  const [hours, minutes] = time.split(":").map(Number);
  return setMilliseconds(setSeconds(setMinutes(setHours(date, hours), minutes), 0), 0);
}

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return isBefore(aStart, bEnd) && isBefore(bStart, aEnd);
}

/**
 * Pure slot-computation function shared by the customer booking flow and the
 * owner's manual "book for a customer" form, so the two never disagree about
 * what counts as available.
 */
export function computeAvailableSlots(opts: ComputeSlotsOptions): Date[] {
  const {
    date,
    openTime,
    closeTime,
    isClosed,
    durationMinutes,
    busy,
    slotIncrementMinutes = 15,
    now = new Date(),
  } = opts;

  if (isClosed || !openTime || !closeTime) return [];

  const dayOpen = timeToDate(date, openTime);
  const dayClose = timeToDate(date, closeTime);

  const slots: Date[] = [];
  let cursor = dayOpen;

  while (isBefore(cursor, dayClose)) {
    const slotEnd = addMinutes(cursor, durationMinutes);
    const fitsBeforeClose = !isBefore(dayClose, slotEnd);
    const isPast = isBefore(cursor, now);
    const isBusy = busy.some((b) => overlaps(cursor, slotEnd, b.start, b.end));

    if (fitsBeforeClose && !isPast && !isBusy) {
      slots.push(cursor);
    }

    cursor = addMinutes(cursor, slotIncrementMinutes);
  }

  return slots;
}
