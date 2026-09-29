import { describe, expect, it } from "vitest";
import { buildIcs, escapeIcsText } from "@/lib/calendar-file";

const event = {
  uid: "Q4VQPF@silke-studio",
  title: "Silke Studio — Manicure",
  startISO: "2026-09-15T08:00:00.000Z",
  durationMinutes: 40,
  location: "Leen B3, 2.3, 2630 Høje Taastrup, Denmark",
  description: "Booking code: Q4VQPF",
};

describe("escapeIcsText", () => {
  it("escapes the characters iCalendar treats as structure", () => {
    expect(escapeIcsText("a,b;c\\d\ne")).toBe("a\\,b\;c\\\\d\\ne");
  });
});

describe("buildIcs", () => {
  const ics = buildIcs(event, new Date("2026-09-01T00:00:00Z"));

  it("uses CRLF line endings throughout, as the spec requires", () => {
    expect(ics.endsWith("\r\n")).toBe(true);
    expect(ics.replace(/\r\n/g, "")).not.toContain("\n");
  });

  it("writes start and end in UTC from the duration", () => {
    expect(ics).toContain("DTSTART:20260915T080000Z");
    expect(ics).toContain("DTEND:20260915T084000Z");
  });

  it("escapes commas in the address so it isn't split into fields", () => {
    expect(ics).toContain("LOCATION:Leen B3\\, 2.3\\, 2630 Høje Taastrup\\, Denmark");
  });

  it("adds a reminder only when asked", () => {
    expect(ics).not.toContain("BEGIN:VALARM");
    expect(buildIcs({ ...event, alarmMinutesBefore: 120 })).toContain("TRIGGER:-PT120M");
  });

  it("folds lines longer than 75 bytes, counting multi-byte characters correctly", () => {
    const long = buildIcs({ ...event, description: "ø".repeat(60) });
    for (const line of long.split("\r\n")) {
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    }
    // Unfolding restores the original text exactly.
    expect(long.replace(/\r\n /g, "")).toContain(`DESCRIPTION:${"ø".repeat(60)}`);
  });
});
