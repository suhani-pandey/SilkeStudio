import { describe, expect, it } from "vitest";
import { formatSalon, salonDayKey, salonDayKeyOffset, salonDayRange } from "@/lib/salon-time";

describe("salonDayKey", () => {
  it("uses the studio's calendar day, not UTC's", () => {
    // 23:30 UTC on the 29th is already 01:30 on the 30th in Copenhagen (UTC+2).
    expect(salonDayKey(new Date("2026-09-29T23:30:00Z"))).toBe("2026-09-30");
  });
});

describe("salonDayRange", () => {
  it("spans the studio's midnight to midnight in summer (UTC+2)", () => {
    const { from, to } = salonDayRange("2026-07-15");
    expect(from.toISOString()).toBe("2026-07-14T22:00:00.000Z");
    expect(to.toISOString()).toBe("2026-07-15T21:59:59.999Z");
  });

  it("and in winter (UTC+1)", () => {
    const { from } = salonDayRange("2026-01-15");
    expect(from.toISOString()).toBe("2026-01-14T23:00:00.000Z");
  });

  it("handles the 23-hour day when the clocks go forward", () => {
    // 29 March 2026: 02:00 jumps to 03:00 in Copenhagen.
    const { from, to } = salonDayRange("2026-03-29");
    const hours = (to.getTime() + 1 - from.getTime()) / 3_600_000;
    expect(hours).toBe(23);
  });
});

describe("salonDayKeyOffset", () => {
  it("steps whole days across the autumn clock change", () => {
    // 25 October 2026 is 25 hours long; stepping over it must still land on the 26th.
    expect(salonDayKeyOffset(new Date("2026-10-24T10:00:00Z"), 2)).toBe("2026-10-26");
  });
});

describe("formatSalon", () => {
  it("shows studio wall-clock time regardless of where the code runs", () => {
    expect(formatSalon("2026-09-30T08:00:00.000Z", "HH:mm")).toBe("10:00");
  });
});
