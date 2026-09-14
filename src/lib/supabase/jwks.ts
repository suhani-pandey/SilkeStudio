import "server-only";
import type { JWK } from "@supabase/supabase-js";

interface Jwks {
  keys: JWK[];
}

let cached: Jwks | null = null;
let cachedAt = 0;
let inFlight: Promise<Jwks | null> | null = null;

const TTL_MS = 10 * 60 * 1000;

/**
 * The project's public signing keys, fetched once per server process.
 *
 * Supabase verifies a session token against these. Left to itself the client re-fetches them on
 * most requests — a fresh client is built per request, and its key cache does not reliably carry
 * over — which put a ~130 ms round-trip in front of every page a signed-in visitor opened.
 * Holding them here keeps `getClaims()` purely local: still a real signature check, no network.
 *
 * Public key material only; nothing here is secret.
 */
export async function getCachedJwks(): Promise<Jwks | null> {
  const now = Date.now();
  if (cached && now - cachedAt < TTL_MS) return cached;
  if (inFlight) return inFlight;

  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/.well-known/jwks.json`;

  inFlight = (async () => {
    try {
      const response = await fetch(url, {
        headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! },
        cache: "no-store",
      });
      if (!response.ok) return cached;

      const json = (await response.json()) as Jwks;
      if (!Array.isArray(json?.keys)) return cached;

      cached = json;
      cachedAt = Date.now();
      return cached;
    } catch {
      // Keep serving the previous copy rather than failing a page render over it.
      return cached;
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}
