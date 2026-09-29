/**
 * Builds an .ics calendar file for a booking, so a customer can put it in their own calendar in
 * one tap — the booking code travels with it, which is the easiest way not to lose it.
 *
 * Pure and dependency-free so it runs in the browser and can be unit tested.
 */
export interface CalendarEvent {
  uid: string;
  title: string;
  startISO: string;
  durationMinutes: number;
  location: string;
  description: string;
  /** Minutes before the start to remind. */
  alarmMinutesBefore?: number;
}

/** RFC 5545 UTC date-time: 20260915T080000Z */
function toIcsDate(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

/** Commas, semicolons, backslashes and newlines are structural in iCalendar and must be escaped. */
export function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** Lines longer than 75 octets must be folded with CRLF + a single space (RFC 5545 §3.1). */
function fold(line: string): string {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;

  const parts: string[] = [];
  let current = "";
  let currentBytes = 0;
  for (const char of line) {
    const size = new TextEncoder().encode(char).length;
    // First line may hold 75 octets; continuation lines lose one to the leading space.
    const limit = parts.length === 0 ? 75 : 74;
    if (currentBytes + size > limit) {
      parts.push(current);
      current = "";
      currentBytes = 0;
    }
    current += char;
    currentBytes += size;
  }
  parts.push(current);
  return parts.join("\r\n ");
}

export function buildIcs(event: CalendarEvent, now: Date = new Date()): string {
  const start = new Date(event.startISO);
  const end = new Date(start.getTime() + event.durationMinutes * 60_000);

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Silke Studio//Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.uid}`,
    `DTSTAMP:${toIcsDate(now)}`,
    `DTSTART:${toIcsDate(start)}`,
    `DTEND:${toIcsDate(end)}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
    `LOCATION:${escapeIcsText(event.location)}`,
    `DESCRIPTION:${escapeIcsText(event.description)}`,
  ];

  if (event.alarmMinutesBefore) {
    lines.push(
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      `DESCRIPTION:${escapeIcsText(event.title)}`,
      `TRIGGER:-PT${event.alarmMinutesBefore}M`,
      "END:VALARM",
    );
  }

  lines.push("END:VEVENT", "END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}
