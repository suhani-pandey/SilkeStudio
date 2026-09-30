import { describe, expect, it } from "vitest";
import { canCancelOnline, lateCancellationMessage } from "@/lib/booking-policy";

const now = new Date("2026-10-01T10:00:00Z");
const hoursFromNow = (h: number) => new Date(now.getTime() + h * 3_600_000).toISOString();

describe("canCancelOnline", () => {
  it("allows cancelling more than 24 hours ahead", () => {
    expect(canCancelOnline(hoursFromNow(25), now)).toBe(true);
    expect(canCancelOnline(hoursFromNow(24.01), now)).toBe(true);
  });

  it("closes online cancellation at exactly 24 hours, matching the database rule", () => {
    expect(canCancelOnline(hoursFromNow(24), now)).toBe(false);
    expect(canCancelOnline(hoursFromNow(2), now)).toBe(false);
  });

  it("doesn't allow cancelling an appointment that has already started", () => {
    expect(canCancelOnline(hoursFromNow(-1), now)).toBe(false);
  });
});

describe("lateCancellationMessage", () => {
  it("tells the customer to phone, with the number", () => {
    expect(lateCancellationMessage()).toMatch(/call 91 71 90 63/);
  });
});
