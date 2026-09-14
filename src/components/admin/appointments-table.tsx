"use client";

import { useMemo, useState, useTransition } from "react";
import { format, isPast } from "date-fns";
import { CalendarClock, Check, Loader2, Phone, Search, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { SlotPicker } from "@/components/admin/slot-picker";
import { updateAppointmentStatus, rescheduleAppointment } from "@/lib/actions/admin";
import { formatPrice } from "@/lib/format";
import {
  appointmentServiceNames,
  appointmentServices,
  type AppointmentWithServices,
  type AppointmentStatus,
} from "@/lib/database.types";

type Filter = "upcoming" | "past" | "cancelled";

export function AppointmentsTable({ appointments }: { appointments: AppointmentWithServices[] }) {
  const [filter, setFilter] = useState<Filter>("upcoming");
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const [rescheduleTarget, setRescheduleTarget] = useState<AppointmentWithServices | null>(null);
  const [newSlotISO, setNewSlotISO] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<AppointmentWithServices | null>(null);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return appointments
      .filter((a) => {
        const past = isPast(new Date(a.end_at));
        if (filter === "cancelled") return a.status === "cancelled";
        if (filter === "past") return a.status !== "cancelled" && past;
        return a.status !== "cancelled" && !past;
      })
      .filter((a) => {
        if (!needle) return true;
        return [a.guest_name, a.guest_phone, a.reference ?? "", appointmentServiceNames(a)]
          .join(" ")
          .toLowerCase()
          .includes(needle);
      })
      .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());
  }, [appointments, filter, query]);

  function handleStatus(id: string, status: AppointmentStatus) {
    startTransition(async () => {
      try {
        await updateAppointmentStatus(id, status);
        toast.success(status === "cancelled" ? "Appointment cancelled." : "Marked as completed.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  function handleReschedule() {
    if (!rescheduleTarget || !newSlotISO) return;
    startTransition(async () => {
      try {
        await rescheduleAppointment(rescheduleTarget.id, newSlotISO);
        toast.success("Appointment rescheduled.");
        setRescheduleTarget(null);
        setNewSlotISO(null);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="upcoming" className="flex-1 sm:flex-none">
              Upcoming
            </TabsTrigger>
            <TabsTrigger value="past" className="flex-1 sm:flex-none">
              Past
            </TabsTrigger>
            <TabsTrigger value="cancelled" className="flex-1 sm:flex-none">
              Cancelled
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative sm:w-64">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name, phone or code"
            className="h-11 pl-9"
            aria-label="Search appointments"
          />
        </div>
      </div>

      {filtered.length === 0 && (
        <p className="text-muted-foreground py-16 text-center text-sm">
          {query ? "Nothing matches that search." : "No appointments here."}
        </p>
      )}

      {/* One card per booking — reads far better on a phone than a scrolling table. */}
      <div className="mt-4 space-y-3">
        {filtered.map((appt) => (
          <div key={appt.id} className="rounded-lg border p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-heading text-lg font-medium">
                  {format(new Date(appt.start_at), "EEE d MMM 'at' HH:mm")}
                </p>
                <p className="mt-0.5 font-medium">
                  {appt.guest_name}
                  {appt.fulfilment === "dropoff" && (
                    <Badge variant="secondary" className="ml-2 align-middle">
                      Drop-off
                    </Badge>
                  )}
                </p>
                <p className="text-muted-foreground mt-1 text-sm">{appointmentServiceNames(appt)}</p>
                <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                  <a
                    href={`tel:${appt.guest_phone.replace(/\s/g, "")}`}
                    className="hover:text-clay inline-flex min-h-9 items-center gap-1.5"
                  >
                    <Phone className="size-3.5" />
                    {appt.guest_phone}
                  </a>
                  {appt.reference && (
                    <span className="tracking-widest uppercase">{appt.reference}</span>
                  )}
                </div>
                {appt.notes && <p className="text-muted-foreground mt-2 text-sm italic">{appt.notes}</p>}
              </div>

              <div className="flex flex-col items-end gap-2">
                <span className="font-heading text-lg font-semibold">{formatPrice(appt.total_price)}</span>
                <Badge
                  variant={
                    appt.status === "cancelled"
                      ? "destructive"
                      : appt.status === "completed"
                        ? "secondary"
                        : "default"
                  }
                >
                  {appt.status}
                </Badge>
              </div>
            </div>

            {appt.status === "confirmed" && (
              <div className="mt-4 flex flex-wrap gap-2 border-t pt-3">
                <Button
                  variant="outline"
                  className="h-10 flex-1 sm:flex-none"
                  disabled={isPending}
                  onClick={() => {
                    setRescheduleTarget(appt);
                    setNewSlotISO(null);
                  }}
                >
                  <CalendarClock className="size-4" />
                  Reschedule
                </Button>
                <Button
                  variant="outline"
                  className="h-10 flex-1 sm:flex-none"
                  disabled={isPending}
                  onClick={() => handleStatus(appt.id, "completed")}
                >
                  <Check className="size-4" />
                  Done
                </Button>
                <Button
                  variant="outline"
                  className="h-10 flex-1 sm:flex-none"
                  disabled={isPending}
                  onClick={() => setCancelTarget(appt)}
                >
                  <X className="size-4" />
                  Cancel
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={!!cancelTarget}
        onOpenChange={(open) => !open && setCancelTarget(null)}
        title="Cancel this appointment?"
        description="The customer is notified, and the slot opens up again."
        detail={
          cancelTarget && (
            <>
              <p className="font-medium">{cancelTarget.guest_name}</p>
              <p className="text-muted-foreground mt-1 text-sm">
                {appointmentServiceNames(cancelTarget)} ·{" "}
                {format(new Date(cancelTarget.start_at), "EEE d MMM 'at' HH:mm")}
              </p>
            </>
          )
        }
        confirmLabel="Yes, cancel it"
        cancelLabel="Keep it"
        isPending={isPending}
        onConfirm={() => {
          if (!cancelTarget) return;
          handleStatus(cancelTarget.id, "cancelled");
          setCancelTarget(null);
        }}
      />

      <Dialog open={!!rescheduleTarget} onOpenChange={(open) => !open && setRescheduleTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule appointment</DialogTitle>
          </DialogHeader>
          {rescheduleTarget && (
            <SlotPicker
              serviceIds={appointmentServices(rescheduleTarget).map((s) => s.id)}
              excludeAppointmentId={rescheduleTarget.id}
              selectedSlotISO={newSlotISO}
              onSelectSlot={setNewSlotISO}
            />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRescheduleTarget(null)}>
              Cancel
            </Button>
            <Button onClick={handleReschedule} disabled={!newSlotISO || isPending}>
              {isPending ? <Loader2 className="size-4 animate-spin" /> : "Save new time"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
