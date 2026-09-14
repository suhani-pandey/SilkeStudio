"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, CalendarPlus, LayoutDashboard, ListChecks, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/admin", label: "Today", icon: LayoutDashboard, exact: true },
  { href: "/admin/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/admin/appointments/new", label: "Add", icon: CalendarPlus, exact: true },
  { href: "/admin/appointments", label: "Bookings", icon: ListChecks, exact: true },
  { href: "/admin/availability", label: "Settings", icon: Settings },
];

/** The owner works from her phone all day, so her main actions belong within thumb reach. */
export function AdminBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Admin"
      className="bg-background/95 fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <ul className="flex">
        {tabs.map((tab) => {
          const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-16 flex-col items-center justify-center gap-1 px-1",
                  active ? "text-clay" : "text-muted-foreground",
                )}
              >
                <Icon className={cn("size-5", active && "stroke-[2.25]")} />
                <span className="w-full truncate text-center text-[0.65rem] leading-none font-medium">
                  {tab.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
