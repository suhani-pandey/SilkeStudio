import { describe, expect, it } from "vitest";
import { confirmationStatus } from "@/lib/confirmation-status";

describe("confirmationStatus", () => {
  it("counts the customer as told if any channel got through", () => {
    expect(confirmationStatus({ sms: true, email: false })).toBe("sent");
    expect(confirmationStatus({ sms: false, email: true })).toBe("sent");
    expect(confirmationStatus({ sms: true, email: null })).toBe("sent");
  });

  it("flags a failure when everything that was tried failed", () => {
    expect(confirmationStatus({ sms: false, email: false })).toBe("failed");
    expect(confirmationStatus({ sms: null, email: false })).toBe("failed");
  });

  it("distinguishes nothing tried from something failing", () => {
    expect(confirmationStatus({ sms: null, email: null })).toBe("unavailable");
  });
});
