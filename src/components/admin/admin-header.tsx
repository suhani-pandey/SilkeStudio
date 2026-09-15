"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { NotificationBell } from "@/components/notification-bell";
import { Logo } from "@/components/site/logo";
import { AdminNavLinks } from "@/components/admin/admin-nav-links";
import { markNotificationRead } from "@/lib/actions/notifications";
import { signOut } from "@/lib/actions/auth";
import type { AppointmentNotification } from "@/lib/database.types";
import { useState } from "react";

export function AdminHeader({
  initialNotifications,
}: {
  initialNotifications: AppointmentNotification[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <header className="bg-background/90 sticky top-0 z-40 flex h-16 items-center justify-between border-b px-4 backdrop-blur sm:px-6">
      <div className="flex items-center gap-2">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72">
            <SheetHeader>
              <SheetTitle className="sr-only">Silke Studio Admin</SheetTitle>
              <Logo className="h-8" />
            </SheetHeader>
            <div className="px-4">
              <AdminNavLinks onNavigate={() => setOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
        <Link href="/admin" className="flex lg:hidden" aria-label="Silke Studio admin home">
          <Logo className="h-8" />
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <NotificationBell
          initialNotifications={initialNotifications}
          filter="audience=eq.owner"
          onMarkRead={markNotificationRead}
        />
        <form action={signOut}>
          <Button variant="ghost" size="sm" type="submit">
            Log out
          </Button>
        </form>
      </div>
    </header>
  );
}
