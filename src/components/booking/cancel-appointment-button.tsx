"use client";

import { useState, useTransition } from "react";
import { formatInTimeZone } from "date-fns-tz";
import { Phone, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cancelOwnAppointment } from "@/lib/actions/booking";
import { dateLocale } from "@/lib/date-locale";
import { canCancelOnline } from "@/lib/booking-policy";
import { businessInfo, SALON_TIMEZONE } from "@/lib/business-info";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export function CancelAppointmentButton({
  appointmentId,
  serviceNames,
  startAtISO,
  t,
  locale,
}: {
  appointmentId: string;
  serviceNames: string;
  startAtISO: string;
  t: Dictionary["myAppointments"];
  locale: Locale;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      try {
        const result = await cancelOwnAppointment(appointmentId);
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        toast.success(t.cancelled);
        setOpen(false);
      } catch {
        // Only reached if the request itself failed, e.g. no connection.
        toast.error(t.cancelError);
      }
    });
  }

  // Inside the notice period the database refuses online cancellation, so offer the phone.
  if (!canCancelOnline(startAtISO)) {
    return (
      <Button asChild variant="outline" size="sm" className="h-10">
        <a href={businessInfo.phoneHref}>
          <Phone className="size-4" />
          {t.callToCancel}
        </a>
      </Button>
    );
  }

  return (
    <>
      <Button variant="outline" size="sm" className="h-10" onClick={() => setOpen(true)}>
        <X className="size-4" />
        {t.cancel}
      </Button>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={t.cancelConfirmTitle}
        description={t.cancelConfirmBody}
        detail={
          <>
            <p className="font-medium">{serviceNames}</p>
            <p className="text-muted-foreground mt-1 text-sm">
              {formatInTimeZone(new Date(startAtISO), SALON_TIMEZONE, t.dateFormat, {
                locale: dateLocale(locale),
              })}
            </p>
          </>
        }
        confirmLabel={t.cancelConfirmAction}
        cancelLabel={t.keepAppointment}
        onConfirm={handleConfirm}
        isPending={isPending}
      />
    </>
  );
}
