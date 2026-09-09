"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cancelOwnAppointment } from "@/lib/actions/booking";
import { dateLocale } from "@/lib/date-locale";
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
        await cancelOwnAppointment(appointmentId);
        toast.success(t.cancelled);
        setOpen(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t.cancelError);
      }
    });
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
              {format(new Date(startAtISO), t.dateFormat, { locale: dateLocale(locale) })}
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
