import { parsePhoneNumberFromString } from "libphonenumber-js";

/**
 * Contact checks shared by the booking form (instant feedback) and the server (the real
 * enforcement). None of them asks the customer to do anything — they catch fake and mistyped
 * details at the moment they're typed.
 *
 * They can prove a number or address is real; they can't prove it belongs to the person typing
 * it. Only a code sent to it could do that, which would add a step to every booking.
 */

export type PhoneCheck = { valid: true; e164: string } | { valid: false };

/**
 * Validates against the real numbering plan, not just the digit count — so "12345678" and
 * "00000000" are rejected, since no Danish number starts that way. Numbers without a country
 * code are read as Danish; anything starting with + or 00 is read as international.
 */
export function checkPhone(input: string, defaultCountry: "DK" = "DK"): PhoneCheck {
  const cleaned = input.trim().replace(/^00/, "+");
  if (!cleaned) return { valid: false };

  const parsed = parsePhoneNumberFromString(cleaned, defaultCountry);
  if (!parsed || !parsed.isValid()) return { valid: false };
  return { valid: true, e164: parsed.number };
}

/** Deliberately simple: one @, something either side, a dot in the domain, no spaces. */
export function isEmailSyntaxValid(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

/** Addresses customers here most often mistype. */
const COMMON_DOMAINS = [
  "gmail.com",
  "hotmail.com",
  "hotmail.dk",
  "outlook.com",
  "outlook.dk",
  "live.com",
  "live.dk",
  "yahoo.com",
  "yahoo.dk",
  "icloud.com",
  "me.com",
  "mail.dk",
  "jubii.dk",
  "stofanet.dk",
  "protonmail.com",
];

function editDistance(a: string, b: string): number {
  const previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diagonal = previous[0];
    previous[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const above = previous[j];
      previous[j] = Math.min(
        previous[j] + 1,
        previous[j - 1] + 1,
        diagonal + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      diagonal = above;
    }
  }
  return previous[b.length];
}

/**
 * "anna@gmial.com" → "anna@gmail.com". Returns null when the domain is already a known one or
 * nothing is close enough, so a genuinely unusual address is never second-guessed.
 */
export function suggestEmailFix(email: string): string | null {
  const at = email.trim().lastIndexOf("@");
  if (at < 1) return null;

  const local = email.trim().slice(0, at);
  const domain = email
    .trim()
    .slice(at + 1)
    .toLowerCase();
  if (!domain || COMMON_DOMAINS.includes(domain)) return null;

  let best: { domain: string; distance: number } | null = null;
  for (const candidate of COMMON_DOMAINS) {
    const distance = editDistance(domain, candidate);
    if (distance <= 2 && (!best || distance < best.distance))
      best = { domain: candidate, distance };
  }
  return best ? `${local}@${best.domain}` : null;
}
