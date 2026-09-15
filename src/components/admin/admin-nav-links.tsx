"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarClock,
  CalendarDays,
  LayoutDashboard,
  ListChecks,
  MessageSquareQuote,
  Scissors,
} from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/admin/appointments", label: "Appointments", icon: ListChecks },
  { href: "/admin/availability", label: "Availability", icon: CalendarClock },
  { href: "/admin/services", label: "Services", icon: Scissors },
  { href: "/admin/testimonials", label: "Reviews", icon: MessageSquareQuote },
];

export function AdminNavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {links.map((link) => {
        const active =
          link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active ? "bg-primary text-primary-foreground" : "hover:bg-accent text-foreground/80",
            )}
          >
            <Icon className="size-4.5" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
