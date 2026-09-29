import "server-only";

/**
 * Cloudflare Turnstile — a bot check that, unlike image CAPTCHAs, is usually invisible to real
 * people and sets no tracking cookies. It's what stops a script from filling the calendar with
 * fake bookings. Stays switched off until both keys are set, like SMS and email.
 */
export function isTurnstileConfigured(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
}

export async function verifyTurnstile(token: string | undefined): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret || !process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) return true;
  if (!token) return false;

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
    });
    const result = (await response.json()) as { success?: boolean };
    return result.success === true;
  } catch (error) {
    // If Cloudflare is unreachable, refusing every booking would hurt real customers more than
    // letting a few through would help; the database's own limits still apply.
    console.error("Turnstile verification failed", error);
    return true;
  }
}
