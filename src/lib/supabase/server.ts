import { cache } from "react";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/database.types";
import { getCachedJwks } from "@/lib/supabase/jwks";

/**
 * Deduplicated per request: a page, its layout and its header all ask for a client, and without
 * `cache()` each one built a fresh Supabase client with its own auth state and its own network
 * calls. One render now shares one client.
 */
export const createClient = cache(async () => {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component with no writable cookies (middleware refreshes the session instead).
          }
        },
      },
    },
  );
});

export interface SessionUser {
  id: string;
  email?: string;
}

/**
 * Who is signed in, without a network round-trip.
 *
 * `auth.getUser()` calls the Supabase Auth API every time, which cost 150–300 ms on every single
 * navigation — the main source of the lag between pages. `getClaims()` verifies the token's
 * signature locally against the project's public key (fetched once and cached), so it is
 * effectively free while still being a real cryptographic check, not a blind decode.
 *
 * Cached per request, so calling it from a layout and a header costs one verification, not two.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const [supabase, jwks] = await Promise.all([createClient(), getCachedJwks()]);
  const { data, error } = await supabase.auth.getClaims(undefined, jwks ? { jwks } : undefined);
  if (error || !data?.claims?.sub) return null;

  return { id: data.claims.sub, email: data.claims.email as string | undefined };
});

/** The signed-in owner's profile row, or null. Cached per request. */
export const getOwnerProfile = cache(async () => {
  const user = await getSessionUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return data;
});
