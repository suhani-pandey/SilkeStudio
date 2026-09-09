import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

/**
 * Server-side client that bypasses row level security. Only for work that legitimately has no
 * user behind it — delivering the owner's push alerts after a guest books, for example, where
 * the guest must never be able to read the owner's devices.
 *
 * Never import this from a client component. Returns null when the key isn't configured so
 * optional features stay dormant rather than crashing.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;

  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
