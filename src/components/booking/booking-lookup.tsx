"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { CalendarCheck, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDuration, formatPrice } from "@/lib/format";
import { cancelBookingByReference, findBooking, type FoundBooking } from "@/lib/actions/lookup";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { dateLocale } from "@/lib/date-locale";

export function BookingLookup({ t, locale }: { t: Dictionary["lookup"]; locale: Locale }) {
  const [reference, setReference] = useState("");
  const [phone, setPhone] = useState("");
  const [booking, setBooking] = useState<FoundBooking | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!reference.trim() || !phone.trim()) return;

    startTransition(async () => {
      try {
        const found = await findBooking(reference.trim(), phone.trim());
        setBooking(found);
        setNotFound(!found);
      } catch {
        toast.error(t.notFound);
      }
    });
  }

  function handleCancel() {
    if (!booking) return;

    startTransition(async () => {
      try {
        const ok = await cancelBookingByReference(reference.trim(), phone.trim());
        if (ok) {
          setBooking({ ...booking, status: "cancelled" });
          setConfirmOpen(false);
          toast.success(t.cancelDone);
        } else {
          toast.error(t.cancelFailed);
        }
      } catch {
        toast.error(t.cancelFailed);
      }
    });
  }

  function reset() {
    setBooking(null);
    setNotFound(false);
    setReference("");
    setPhone("");
  }

  if (booking) {
    const past = new Date(booking.startAtISO) < new Date();
    const cancellable = booking.status === "confirmed" && !past;

    return (
      <div className="mx-auto max-w-md px-5 py-14 sm:px-6">
        <p className="eyebrow text-center">{t.eyebrow}</p>
        <h1 className="font-heading mt-3 text-center text-3xl font-medium">{booking.guestName}</h1>
        <div className="rule-copper mx-auto mt-5" />

        <div className="mt-8 border p-6">
          <div className="flex items-center gap-2">
            <CalendarCheck className="text-copper size-5 shrink-0" />
            <p className="font-heading text-xl font-medium">
              {format(new Date(booking.startAtISO), t.dateFormat, { locale: dateLocale(locale) })}
            </p>
          </div>
          <p className="text-muted-foreground mt-3 text-sm">{booking.services}</p>
          <div className="mt-4 flex items-center justify-between border-t pt-4">
            <span className="text-muted-foreground text-sm">{formatDuration(booking.durationMinutes)}</span>
            <span className="font-heading text-lg font-semibold">{formatPrice(booking.totalPrice)}</span>
          </div>
        </div>

        {booking.status === "cancelled" && (
          <p className="text-destructive mt-5 text-center text-sm">{t.cancelled}</p>
        )}
        {booking.status === "completed" && (
          <p className="text-muted-foreground mt-5 text-center text-sm">{t.completed}</p>
        )}

        <div className="mt-8 flex flex-col gap-3">
          {cancellable && (
            <Button variant="outline" className="h-12" onClick={() => setConfirmOpen(true)}>
              {t.cancel}
            </Button>
          )}
          <Button variant="ghost" className="h-12" onClick={reset}>
            {t.searchAgain}
          </Button>
        </div>

        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title={t.cancelConfirmTitle}
          description={t.cancelConfirmBody}
          detail={
            <>
              <p className="font-medium">{booking.services}</p>
              <p className="text-muted-foreground mt-1 text-sm">
                {format(new Date(booking.startAtISO), t.dateFormat, { locale: dateLocale(locale) })}
              </p>
            </>
          }
          confirmLabel={t.cancelConfirmAction}
          cancelLabel={t.keepAppointment}
          onConfirm={handleCancel}
          isPending={isPending}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm px-5 py-14 sm:px-6">
      <p className="eyebrow text-center">{t.eyebrow}</p>
      <h1 className="font-heading mt-3 text-center text-3xl font-medium">{t.title}</h1>
      <div className="rule-copper mx-auto mt-5" />
      <p className="text-muted-foreground mt-5 text-center text-sm">{t.body}</p>

      <form className="mt-8 space-y-5" onSubmit={handleSearch}>
        <div>
          <Label htmlFor="reference" className="mb-2 block">
            {t.reference}
          </Label>
          <Input
            id="reference"
            value={reference}
            onChange={(e) => setReference(e.target.value.toUpperCase())}
            autoCapitalize="characters"
            autoComplete="off"
            placeholder="ABC123"
            className="h-12 text-center text-lg tracking-[0.3em]"
            required
          />
        </div>
        <div>
          <Label htmlFor="phone" className="mb-2 block">
            {t.phone}
          </Label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="h-12"
            required
          />
        </div>

        {notFound && <p className="text-destructive text-sm">{t.notFound}</p>}

        <Button type="submit" className="h-12 w-full" disabled={isPending}>
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <>
              <Search className="size-4" />
              {t.find}
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
