import Link from "next/link";
import { Menu } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getNotificationsForCustomer, markNotificationRead } from "@/lib/actions/notifications";
import { NotificationBell } from "@/components/notification-bell";
import { Logo } from "@/components/site/logo";
import { LanguageToggle } from "@/components/site/language-toggle";
import { Button } from "@/components/ui/button";
import { getLocale, getT } from "@/lib/i18n/server";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";

export async function SiteHeader() {
  const supabase = await createClient();
  const [{ data }, t, locale] = await Promise.all([supabase.auth.getUser(), getT(), getLocale()]);
  const user = data.user;

  const notifications = user ? await getNotificationsForCustomer() : [];

  const navLinks = [
    { href: "/", label: t.nav.home },
    { href: "/services", label: t.nav.services },
    { href: "/book", label: t.nav.book },
  ];

  return (
    <header className="bg-background/95 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:h-20 sm:px-6">
        <Link href="/" aria-label={t.nav.home_aria}>
          <Logo className="h-9 sm:h-11" />
        </Link>

        <nav className="hidden items-center gap-6 md:flex lg:gap-10">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:text-plum text-xs font-semibold tracking-[0.18em] uppercase transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageToggle current={locale} />
          {user ? (
            <>
              <NotificationBell
                initialNotifications={notifications}
                filter={`customer_id=eq.${user.id}`}
                onMarkRead={markNotificationRead}
              />
              <Button asChild variant="ghost" className="hidden md:inline-flex">
                <Link href="/my-appointments">{t.nav.myAppointments}</Link>
              </Button>
            </>
          ) : (
            <Button asChild variant="ghost" className="hidden md:inline-flex">
              <Link href="/login">{t.nav.login}</Link>
            </Button>
          )}
          <Button asChild className="hidden h-11 px-6 sm:inline-flex">
            <Link href="/book">{t.nav.bookNow}</Link>
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="size-11 md:hidden" aria-label={t.nav.menu}>
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetHeader>
                <SheetTitle className="sr-only">{t.nav.menu}</SheetTitle>
                <Logo className="h-10" />
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-4">
                {navLinks.map((link) => (
                  <SheetClose asChild key={link.href}>
                    <Link
                      href={link.href}
                      className="hover:bg-secondary rounded-md px-3 py-3.5 text-base font-medium"
                    >
                      {link.label}
                    </Link>
                  </SheetClose>
                ))}
                <SheetClose asChild>
                  <Link
                    href={user ? "/my-appointments" : "/login"}
                    className="hover:bg-secondary rounded-md px-3 py-3.5 text-base font-medium"
                  >
                    {user ? t.nav.myAppointments : t.nav.login}
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link
                    href="/book"
                    className="bg-primary text-primary-foreground mt-3 rounded-md px-3 py-3.5 text-center text-base font-medium"
                  >
                    {t.nav.bookNow}
                  </Link>
                </SheetClose>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
