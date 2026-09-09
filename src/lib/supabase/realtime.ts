import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

export interface RealtimeTable {
  table: string;
  event?: "INSERT" | "UPDATE" | "DELETE" | "*";
  filter?: string;
}

type Change = RealtimePostgresChangesPayload<Record<string, unknown>>;

/**
 * Subscribes to Postgres changes with the signed-in user's token attached.
 *
 * Realtime enforces row-level security against the token the socket carries, and the browser
 * client does not hand the session over by itself — so without this every event on an RLS-guarded
 * table (notifications, appointments) was silently dropped and the UI only caught up on a refresh.
 *
 * Each caller gets its own channel: a table that isn't in the `supabase_realtime` publication
 * fails the whole channel it belongs to, so keeping them separate stops one from taking the
 * others down with it.
 *
 * Returns an unsubscribe function.
 */
export function subscribeWithAuth(
  channelName: string,
  tables: RealtimeTable[],
  onChange: (payload: Change) => void,
): () => void {
  const supabase = createClient();
  let channel: RealtimeChannel | null = null;
  let cancelled = false;

  // Keep the socket's token current — Supabase rotates the access token roughly hourly.
  const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.access_token) supabase.realtime.setAuth(session.access_token);
  });

  void (async () => {
    const { data } = await supabase.auth.getSession();
    if (cancelled) return;
    if (data.session?.access_token) supabase.realtime.setAuth(data.session.access_token);

    const next = supabase.channel(channelName);
    for (const t of tables) {
      next.on(
        "postgres_changes",
        { event: t.event ?? "*", schema: "public", table: t.table, ...(t.filter ? { filter: t.filter } : {}) },
        onChange,
      );
    }

    next.subscribe((status, err) => {
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        // Almost always means the table is missing from the `supabase_realtime` publication.
        console.error(`Realtime channel "${channelName}" failed (${status}).`, err);
      }
    });

    if (cancelled) {
      void supabase.removeChannel(next);
      return;
    }
    channel = next;
  })();

  return () => {
    cancelled = true;
    authListener.subscription.unsubscribe();
    if (channel) void supabase.removeChannel(channel);
  };
}
