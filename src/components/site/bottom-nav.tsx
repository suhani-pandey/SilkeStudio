"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarPlus, Home, Palette, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Dictionary } from "@/lib/i18n/dictionaries";

/**
 * Thumb-reachable tab bar — the primary navigation on phones, where the top nav is out of reach.
 * Hidden from tablet up, where the header nav takes over.
 *
 * Four places a customer actually goes. Logging in is optional for customers, so it lives in the
 * menu rather than spending a quarter of the bar on something most visitors never use.
 */
export function BottomNav({ t }: { t: Dictionary["nav"] }) {
  const pathname = usePathname();

  const tabs = [
    { href: "/", label: t.home, icon: Home },
    { href: "/services", label: t.services, icon: Sparkles },
    { href: "/designs", label: t.designs, icon: Palette },
    { href: "/book", label: t.book, icon: CalendarPlus },
  ];

  return (
    <nav
      aria-label="Primary"
      className="bg-background/95 fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <ul className="flex">
        {tabs.map((tab) => {
          const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-16 flex-col items-center justify-center gap-1 px-1 transition-colors",
                  active ? "text-clay" : "text-muted-foreground",
                )}
              >
                <Icon className={cn("size-5.5", active && "stroke-[2.25]")} />
                <span className="w-full truncate text-center text-[0.68rem] leading-none font-medium">
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
