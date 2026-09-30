/**
 * Results for Server Actions, instead of thrown errors.
 *
 * In production Next.js replaces the message of any error thrown from a Server Action with a
 * generic one, so a customer never saw "that slot was just taken" or "please call to cancel" —
 * only an opaque React error code. Expected failures are returned instead, as Next recommends.
 *
 * Only messages written for customers travel back. A UserError, or a message the database raised
 * deliberately, is shown as-is; anything unexpected is logged and replaced with a generic line,
 * so internal details (constraint names, SQL) still never reach the browser.
 */
export type ActionResult<T = null> =
  { ok: true; data: T } | { ok: false; error: string; code?: string };

/**
 * A failure whose message was written for the person using the site. `code` lets the page react
 * to the kind of failure, not just show the text — e.g. sending someone back to pick a new time.
 */
export class UserError extends Error {
  constructor(
    message: string,
    readonly code?: string,
  ) {
    super(message);
  }
}

/** PL/pgSQL `raise exception` (P0001) and our own 24-hour rule (P0024) carry messages for users. */
const USER_FACING_SQLSTATES = new Set(["P0001", "P0024"]);

export function isUserFacingDbError(error: { code?: string } | null | undefined): boolean {
  return Boolean(error?.code && USER_FACING_SQLSTATES.has(error.code));
}

const GENERIC = "Something went wrong. Please try again, or give us a call.";

export async function runAction<T>(work: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await work() };
  } catch (error) {
    // redirect() and notFound() signal through thrown errors; they must keep propagating.
    const digest = (error as { digest?: unknown })?.digest;
    if (typeof digest === "string" && digest.startsWith("NEXT_")) throw error;

    if (error instanceof UserError) {
      return error.code
        ? { ok: false, error: error.message, code: error.code }
        : { ok: false, error: error.message };
    }

    console.error("Server action failed", error);
    return { ok: false, error: GENERIC };
  }
}
