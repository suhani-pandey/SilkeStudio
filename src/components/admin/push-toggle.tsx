"use client";

import { useEffect, useState, useTransition } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { removePushSubscription, savePushSubscription } from "@/lib/actions/push";

function urlBase64ToUint8Array(base64: string): BufferSource {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const normalised = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(normalised);
  const buffer = new ArrayBuffer(raw.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i += 1) view[i] = raw.charCodeAt(i);
  return view;
}

/**
 * Turns on new-booking alerts for this device. Notifications only reach a phone that has the
 * app installed and has granted permission, so this has to be enabled per device.
 */
export function PushToggle({ vapidKey }: { vapidKey: string }) {
  const [subscribed, setSubscribed] = useState<boolean | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    const supported =
      typeof navigator !== "undefined" && "serviceWorker" in navigator && "PushManager" in window;

    const lookup = supported
      ? navigator.serviceWorker.ready.then((reg) => reg.pushManager.getSubscription()).then((sub) => !!sub)
      : Promise.resolve(false);

    lookup
      .then((result) => {
        if (!cancelled) setSubscribed(result);
      })
      .catch(() => {
        if (!cancelled) setSubscribed(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function enable() {
    startTransition(async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          toast.error("Notifications are blocked in your phone's settings for this app.");
          return;
        }
        const registration = await navigator.serviceWorker.ready;
        const sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });
        const json = sub.toJSON() as { endpoint?: string; keys?: { p256dh: string; auth: string } };
        await savePushSubscription({
          endpoint: json.endpoint!,
          p256dh: json.keys!.p256dh,
          auth: json.keys!.auth,
        });
        setSubscribed(true);
        toast.success("You'll get a notification for every new booking.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Couldn't turn on notifications.");
      }
    });
  }

  function disable() {
    startTransition(async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        const sub = await registration.pushManager.getSubscription();
        if (sub) {
          await removePushSubscription(sub.endpoint);
          await sub.unsubscribe();
        }
        setSubscribed(false);
        toast.success("Notifications turned off for this device.");
      } catch {
        toast.error("Couldn't turn off notifications.");
      }
    });
  }

  if (subscribed === null) return null;

  return (
    <Button
      variant={subscribed ? "outline" : "default"}
      className="h-11"
      onClick={subscribed ? disable : enable}
      disabled={isPending}
    >
      {isPending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : subscribed ? (
        <BellOff className="size-4" />
      ) : (
        <Bell className="size-4" />
      )}
      {subscribed ? "Alerts on" : "Turn on booking alerts"}
    </Button>
  );
}
