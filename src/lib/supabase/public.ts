import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

/**
 * A Supabase client with no cookies attached, for data that is the same for everybody: the
 * service menu, opening hours, published reviews.
 *
 * The cookie-bound client can't be used inside `unstable_cache` — reading cookies makes the call
 * request-specific, so Next opts it out of the cache and queries Supabase on every page view.
 * This client reads only what row-level security already exposes to anonymous visitors, so
 * dropping the session costs nothing and makes the results genuinely cacheable.
 */
export function createPublicClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
