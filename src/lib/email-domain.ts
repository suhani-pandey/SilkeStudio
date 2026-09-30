import "server-only";

import { resolve4, resolve6, resolveMx } from "node:dns/promises";

export type EmailDomainCheck = { ok: true } | { ok: false; reason: "disposable" | "no-mail" };

let disposable: Set<string> | null = null;

/** 120,000 throwaway-address domains. Loaded on first use and kept for the life of the process. */
async function disposableDomains(): Promise<Set<string>> {
  if (!disposable) {
    const list = (await import("disposable-email-domains")).default as string[];
    disposable = new Set(list);
  }
  return disposable;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
  ]);
}

/** DNS errors that genuinely mean "this domain can't receive mail", as opposed to "DNS was slow". */
function isDefinitiveMiss(error: unknown): boolean {
  const code = (error as { code?: string })?.code;
  return code === "ENOTFOUND" || code === "ENODATA" || code === "NXDOMAIN";
}

/**
 * Checks an address's domain can actually receive mail, and isn't a throwaway service.
 *
 * Fails open: if DNS is slow or unreachable, the address is accepted. Turning away a real
 * customer because of a network hiccup would cost more than the occasional bad address that
 * slips through.
 */
export async function checkEmailDomain(email: string): Promise<EmailDomainCheck> {
  const domain = email
    .trim()
    .slice(email.lastIndexOf("@") + 1)
    .toLowerCase();
  if (!domain) return { ok: false, reason: "no-mail" };

  if ((await disposableDomains()).has(domain)) return { ok: false, reason: "disposable" };

  try {
    const mx = await withTimeout(resolveMx(domain), 2500);
    if (mx.length > 0) return { ok: true };
  } catch (error) {
    if (!isDefinitiveMiss(error)) return { ok: true };
  }

  // No MX record: mail falls back to the domain's own address, so check it has one.
  try {
    const [v4, v6] = await Promise.allSettled([
      withTimeout(resolve4(domain), 2500),
      withTimeout(resolve6(domain), 2500),
    ]);
    const hasAddress =
      (v4.status === "fulfilled" && v4.value.length > 0) ||
      (v6.status === "fulfilled" && v6.value.length > 0);
    if (hasAddress) return { ok: true };

    const definitive = [v4, v6].every(
      (result) => result.status === "rejected" && isDefinitiveMiss(result.reason),
    );
    return definitive ? { ok: false, reason: "no-mail" } : { ok: true };
  } catch {
    return { ok: true };
  }
}
