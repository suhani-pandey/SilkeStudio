import { Suspense } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { getSessionUser } from "@/lib/supabase/server";
import { CustomerBell, CustomerBellFallback } from "@/components/site/customer-bell";
import { Logo } from "@/components/site/logo";
import { Button } from "@/components/ui/button";
import { getT } from "@/lib/i18n/server";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";

export async function SiteHeader() {
  const [user, t] = await Promise.all([getSessionUser(), getT()]);

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
              className="hover:text-clay text-xs font-semibold tracking-[0.18em] uppercase transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Suspense fallback={<CustomerBellFallback />}>
                <CustomerBell userId={user.id} />
              </Suspense>
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
