"use client";

import { useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { AppointmentNotification } from "@/lib/database.types";

interface NotificationBellProps {
  initialNotifications: AppointmentNotification[];
  filter: string;
  onMarkRead: (id: string) => Promise<void>;
}

export function NotificationBell({ initialNotifications, filter, onMarkRead }: NotificationBellProps) {
  // Notifications pushed in over realtime since mount, kept separate from the server-provided
  // initialNotifications so this never needs to sync state from props in an effect.
  const [liveNotifications, setLiveNotifications] = useState<AppointmentNotification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`notifications-${filter}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter },
        (payload) => {
          setLiveNotifications((prev) => [payload.new as AppointmentNotification, ...prev].slice(0, 30));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filter]);

  const notifications = useMemo(() => {
    const existingIds = new Set(initialNotifications.map((n) => n.id));
    const merged = [...liveNotifications.filter((n) => !existingIds.has(n.id)), ...initialNotifications];
    return merged.map((n) => (readIds.has(n.id) ? { ...n, is_read: true } : n));
  }, [initialNotifications, liveNotifications, readIds]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  function handleMarkRead(id: string) {
    setReadIds((prev) => new Set(prev).add(id));
    onMarkRead(id);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-11 w-11" aria-label="Notifications">
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 min-w-5 justify-center rounded-full px-1 text-xs">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 && (
          <p className="text-muted-foreground px-2 py-4 text-center text-sm">No notifications yet.</p>
        )}
        <div className="max-h-80 overflow-y-auto">
          {notifications.map((n) => (
            <DropdownMenuItem
              key={n.id}
              className={cn("flex flex-col items-start gap-0.5 whitespace-normal py-2", !n.is_read && "bg-accent/60")}
              onSelect={(e) => {
                e.preventDefault();
                if (!n.is_read) handleMarkRead(n.id);
              }}
            >
              <span className="text-sm leading-snug">{n.message}</span>
              <span className="text-muted-foreground text-xs">
                {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
              </span>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
