"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { subscribeWithAuth } from "@/lib/supabase/realtime";

/**
 * Keeps every admin screen — dashboard, calendar, appointment list — current while it sits open,
 * so a booking or cancellation made elsewhere appears without the owner having to reload.
 */
export function LiveRefresh() {
  const router = useRouter();

  useEffect(() => {
    const stop = subscribeWithAuth(
      "admin-live",
      [{ table: "appointments" }, { table: "availability_blocks" }],
      () => router.refresh(),
    );

    // Realtime can miss events while a phone is asleep or the tab is backgrounded, so also
    // re-fetch whenever the owner comes back to the screen.
    const onVisible = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);

    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [router]);

  return null;
}
