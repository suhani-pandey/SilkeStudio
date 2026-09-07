"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Check, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDuration, formatPrice } from "@/lib/format";
import { businessInfo } from "@/lib/business-info";
import type { BookingSummary } from "@/lib/booking-summary";
import type { Dictionary } from "@/lib/i18n/dictionaries";

function subscribe() {
  return () => {};
}

function getSnapshot() {
  return sessionStorage.getItem("lastBooking");
}

function getServerSnapshot() {
  return null;
}

export function ConfirmationView({ t }: { t: Dictionary["confirmation"] }) {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const booking = raw ? (JSON.parse(raw) as BookingSummary) : null;

  if (!booking) {
    return (
      <div className="mx-auto max-w-md px-6 py-28 text-center">
        <h1 className="font-heading text-3xl font-medium">{t.notFoundTitle}</h1>
        <p className="text-muted-foreground mt-3">{t.notFoundBody}</p>
        <Button asChild className="mt-8 h-12 px-8">
          <Link href="/book">{t.notFoundCta}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-20 text-center">
      <div className="bg-accent mx-auto flex size-16 items-center justify-center rounded-full">
        <Check className="text-plum size-7" />
      </div>
      <p className="font-script text-plum mt-6 text-4xl leading-none">{t.thanks}</p>
      <h1 className="font-heading mt-3 text-4xl font-medium">{t.title}</h1>
      <p className="text-muted-foreground mt-3">
        {t.body} {booking.guestName.split(" ")[0]}.
      </p>

      <div className="mt-10 border p-6 text-left">
        <p className="eyebrow">{t.appointment}</p>
        <p className="font-heading mt-2 text-2xl font-medium">
          {format(new Date(booking.startAtISO), "EEEE d MMMM 'at' HH:mm")}
        </p>

        <ul className="text-muted-foreground mt-5 space-y-1.5 text-sm">
          {booking.serviceNames.map((name) => (
            <li key={name} className="flex items-center gap-2">
              <span className="bg-gold size-1 rounded-full" />
              {name}
            </li>
          ))}
        </ul>

        <div className="mt-5 flex items-center justify-between border-t pt-4">
          <span className="text-muted-foreground text-sm">
            {t.total} · {formatDuration(booking.durationMinutes)}
          </span>
          <span className="font-heading text-xl font-semibold">{formatPrice(booking.totalPrice)}</span>
        </div>
      </div>

      <div className="text-muted-foreground mt-8 space-y-2 text-sm">
        <p className="flex items-center justify-center gap-2">
          <MapPin className="text-gold size-4" />
          {businessInfo.address.line1}, {businessInfo.address.line2}
        </p>
        <a href={businessInfo.phoneHref} className="hover:text-plum flex items-center justify-center gap-2">
          <Phone className="text-gold size-4" />
          {businessInfo.phone}
        </a>
      </div>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button asChild variant="outline" className="h-12 px-8">
          <Link href="/">{t.backHome}</Link>
        </Button>
        <Button asChild className="h-12 px-8">
          <Link href="/book">{t.bookAnother}</Link>
        </Button>
      </div>
    </div>
  );
}
