import { Bell } from "lucide-react";
import { NotificationBell } from "@/components/notification-bell";
import { getNotificationsForCustomer, markNotificationRead } from "@/lib/actions/notifications";
import { Button } from "@/components/ui/button";

/**
 * Loading the bell means a database round-trip, and it used to hold up the whole header — and so
 * the whole page — for every signed-in visitor. Rendered inside a <Suspense> boundary it streams
 * in on its own, so the page paints at once and the badge arrives a moment later.
 */
export async function CustomerBell({ userId }: { userId: string }) {
  const notifications = await getNotificationsForCustomer();

  return (
    <NotificationBell
      initialNotifications={notifications}
      filter={`customer_id=eq.${userId}`}
      onMarkRead={markNotificationRead}
    />
  );
}

/** Same footprint as the real bell, so nothing shifts when it arrives. */
export function CustomerBellFallback() {
  return (
    <Button variant="ghost" size="icon" className="h-11 w-11" aria-label="Notifications" disabled>
      <Bell className="size-5" />
    </Button>
  );
}
