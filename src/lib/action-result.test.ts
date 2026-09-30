import { describe, expect, it, vi } from "vitest";
import { isUserFacingDbError, runAction, UserError } from "@/lib/action-result";

describe("runAction", () => {
  it("wraps a successful result", async () => {
    await expect(runAction(async () => 42)).resolves.toEqual({ ok: true, data: 42 });
  });

  it("passes a UserError's message through to the customer", async () => {
    const result = await runAction(async () => {
      throw new UserError("That time slot was just booked.");
    });
    expect(result).toEqual({ ok: false, error: "That time slot was just booked." });
  });

  it("carries a code so the page can react to the kind of failure", async () => {
    const result = await runAction(async () => {
      throw new UserError("That slot was just taken.", "SLOT_TAKEN");
    });
    expect(result).toEqual({ ok: false, error: "That slot was just taken.", code: "SLOT_TAKEN" });
  });

  it("never leaks the message of an unexpected error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await runAction(async () => {
      throw new Error('duplicate key value violates unique constraint "appointments_pkey"');
    });
    expect(result.ok).toBe(false);
    expect(!result.ok && result.error).not.toContain("constraint");
  });

  it("lets Next.js control-flow errors like redirect() keep propagating", async () => {
    const redirect = Object.assign(new Error("NEXT_REDIRECT"), {
      digest: "NEXT_REDIRECT;replace;/",
    });
    await expect(
      runAction(async () => {
        throw redirect;
      }),
    ).rejects.toBe(redirect);
  });
});

describe("isUserFacingDbError", () => {
  it("recognises messages the database raised on purpose", () => {
    expect(isUserFacingDbError({ code: "P0001" })).toBe(true);
    expect(isUserFacingDbError({ code: "P0024" })).toBe(true);
  });

  it("treats everything else as internal", () => {
    expect(isUserFacingDbError({ code: "23505" })).toBe(false);
    expect(isUserFacingDbError(null)).toBe(false);
  });
});
