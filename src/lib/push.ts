import "server-only";

import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Web push to the owner's installed app, so a new booking reaches her phone even with the app
 * closed. Dormant until VAPID keys are set — generate a pair with `npx web-push generate-vapid-keys`.
 */
export function isPushConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

function configure() {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:hello@glownest.dk",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
}

export async function sendPushToOwners(title: string, body: string, url = "/admin") {
  if (!isPushConfigured()) return;
  configure();

  // Runs outside a request's permissions: the booking guest must not be able to read the
  // owner's device tokens, but the server needs them to deliver the alert.
  const supabase = createAdminClient();
  if (!supabase) return;

  const { data: owners } = await supabase.from("profiles").select("id").eq("role", "owner");
  const ownerIds = (owners ?? []).map((o) => o.id);
  if (ownerIds.length === 0) return;

  const { data: subscriptions } = await supabase
    .from("push_subscriptions")
    .select("*")
    .in("profile_id", ownerIds);

  await Promise.all(
    (subscriptions ?? []).map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({ title, body, url }),
        );
      } catch (error) {
        // 404/410 mean the device unsubscribed — drop the dead row rather than retrying forever.
        const statusCode = (error as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
        } else {
          console.error("Push failed", error);
        }
      }
    }),
  );
}
