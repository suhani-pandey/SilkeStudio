import { describe, expect, it } from "vitest";
import { formatInTimeZone } from "date-fns-tz";
import { computeAvailableSlots, type ComputeSlotsOptions } from "@/lib/availability";
import { SALON_TIMEZONE } from "@/lib/business-info";

/** Slots read back as salon wall-clock, which is how the booking screen shows them. */
function times(slots: Date[]): string[] {
  return slots.map((slot) => formatInTimeZone(slot, SALON_TIMEZONE, "HH:mm"));
}

function salonInstant(dayKey: string, time: string): Date {
  // Deliberately built the long way round rather than reusing the module's own helper, so the
  // test would still catch it if that helper started resolving to the wrong timezone.
  return new Date(
    new Date(`${dayKey}T${time}:00Z`).getTime() - offsetMinutes(dayKey, time) * 60_000,
  );
}

function offsetMinutes(dayKey: string, time: string): number {
  const utc = new Date(`${dayKey}T${time}:00Z`);
  const offset = formatInTimeZone(utc, SALON_TIMEZONE, "xxx"); // e.g. "+02:00"
  const [hours, minutes] = offset.slice(1).split(":").map(Number);
  return (offset.startsWith("-") ? -1 : 1) * (hours * 60 + minutes);
}

const baseOptions: ComputeSlotsOptions = {
  dayKey: "2026-07-15",
  openTime: "10:00",
  closeTime: "13:00",
  isClosed: false,
  durationMinutes: 60,
  busy: [],
  // Fixed so the "already past" filter can't make the suite depend on when it runs.
  now: new Date("2026-07-01T00:00:00Z"),
};

describe("computeAvailableSlots", () => {
  it("offers slots from opening time until the treatment no longer fits before closing", () => {
    expect(times(computeAvailableSlots(baseOptions))).toEqual([
      "10:00",
      "10:15",
      "10:30",
      "10:45",
      "11:00",
      "11:15",
      "11:30",
      "11:45",
      "12:00",
    ]);
  });

  it("returns nothing on a closed day, or when hours are missing", () => {
    expect(computeAvailableSlots({ ...baseOptions, isClosed: true })).toEqual([]);
    expect(computeAvailableSlots({ ...baseOptions, openTime: null })).toEqual([]);
    expect(computeAvailableSlots({ ...baseOptions, closeTime: null })).toEqual([]);
  });

  it("removes slots that would overlap an existing booking", () => {
    const busy = [
      {
        start: salonInstant("2026-07-15", "11:00"),
        end: salonInstant("2026-07-15", "12:00"),
      },
    ];
    const slots = times(computeAvailableSlots({ ...baseOptions, durationMinutes: 30, busy }));

    expect(slots).toContain("10:30");
    expect(slots).not.toContain("10:45"); // would run into the 11:00 booking
    expect(slots).not.toContain("11:30");
    expect(slots).toContain("12:00");
  });

  it("blocks the turnaround after a treatment, but still allows it to run past closing", () => {
    const withBuffer = times(
      computeAvailableSlots({ ...baseOptions, durationMinutes: 60, bufferMinutes: 15 }),
    );

    // 12:00 + 60 min treatment ends exactly at closing; the 15 min turnaround may overrun.
    expect(withBuffer).toContain("12:00");

    const busy = [
      {
        start: salonInstant("2026-07-15", "11:00"),
        end: salonInstant("2026-07-15", "11:30"),
      },
    ];
    const slots = times(
      computeAvailableSlots({ ...baseOptions, durationMinutes: 30, bufferMinutes: 30, busy }),
    );
    // 10:15 + 30 min treatment + 30 min turnaround reaches 11:15, which the booking overlaps.
    expect(slots).not.toContain("10:15");
  });

  it("hides slots that have already passed today", () => {
    const slots = times(
      computeAvailableSlots({
        ...baseOptions,
        durationMinutes: 30,
        now: salonInstant("2026-07-15", "11:00"),
      }),
    );

    expect(slots).not.toContain("10:45");
    expect(slots[0]).toBe("11:00");
  });

  it("anchors opening hours to the salon's timezone, not the server's", () => {
    // Høje Taastrup is UTC+2 in July. "10:00" must mean 10am there whatever TZ the host runs in,
    // which is the bug this guards: hosting runs in UTC and would otherwise shift every slot.
    const [first] = computeAvailableSlots(baseOptions);

    expect(first.toISOString()).toBe("2026-07-15T08:00:00.000Z");
    expect(formatInTimeZone(first, SALON_TIMEZONE, "HH:mm")).toBe("10:00");
  });

  it("keeps wall-clock opening hours correct across the daylight-saving change", () => {
    // Same nominal 10:00 open, but January is UTC+1 rather than July's UTC+2.
    const winter = computeAvailableSlots({
      ...baseOptions,
      dayKey: "2026-01-15",
      now: new Date("2026-01-01T00:00:00Z"),
    });

    expect(winter[0].toISOString()).toBe("2026-01-15T09:00:00.000Z");
    expect(formatInTimeZone(winter[0], SALON_TIMEZONE, "HH:mm")).toBe("10:00");
  });
});
