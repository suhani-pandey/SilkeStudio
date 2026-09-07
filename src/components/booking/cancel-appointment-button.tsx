"use client";

import { useTransition } from "react";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cancelOwnAppointment } from "@/lib/actions/booking";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export function CancelAppointmentButton({
  appointmentId,
  t,
}: {
  appointmentId: string;
  t: Dictionary["myAppointments"];
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={() => {
        if (!confirm(t.cancelConfirm)) return;
        startTransition(async () => {
          try {
            await cancelOwnAppointment(appointmentId);
            toast.success(t.cancelled);
          } catch (err) {
            toast.error(err instanceof Error ? err.message : t.cancelError);
          }
        });
      }}
    >
      {isPending ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />}
      {t.cancel}
    </Button>
  );
}
