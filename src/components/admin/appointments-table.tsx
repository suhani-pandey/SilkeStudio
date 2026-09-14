"use client";

import { useMemo, useState, useTransition } from "react";
import { format, isPast } from "date-fns";
import { CalendarClock, Check, Loader2, PackageCheck, Phone, Search, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { SlotPicker } from "@/components/admin/slot-picker";
import {
  markReadyForCollection,
  rescheduleAppointment,
  updateAppointmentStatus,
} from "@/lib/actions/admin";
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
  const [readyTarget, setReadyTarget] = useState<AppointmentWithServices | null>(null);
  const [readyDate, setReadyDate] = useState("");

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

  function handleMarkReady() {
    if (!readyTarget || !readyDate) return;
    startTransition(async () => {
      try {
        await markReadyForCollection(readyTarget.id, readyDate);
        toast.success("Marked ready — the customer has been texted.");
        setReadyTarget(null);
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
                {appt.ready_by && (
                  <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700">
                    <PackageCheck className="size-4" />
                    Ready to collect from {format(new Date(`${appt.ready_by}T12:00:00Z`), "EEE d MMM")}
                  </p>
                )}
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
                {appt.fulfilment === "dropoff" && (
                  <Button
                    variant="outline"
                    className="h-10 flex-1 sm:flex-none"
                    disabled={isPending}
                    onClick={() => {
                      setReadyTarget(appt);
                      setReadyDate(appt.ready_by ?? format(new Date(), "yyyy-MM-dd"));
                    }}
                  >
                    <PackageCheck className="size-4" />
                    {appt.ready_by ? "Change ready date" : "Mark ready"}
                  </Button>
                )}
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

      <Dialog open={!!readyTarget} onOpenChange={(open) => !open && setReadyTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ready for collection</DialogTitle>
          </DialogHeader>
          {readyTarget && (
            <div className="space-y-4">
              <div>
                <p className="font-medium">{readyTarget.guest_name}</p>
                <p className="text-muted-foreground mt-1 text-sm">
                  {appointmentServiceNames(readyTarget)}
                </p>
              </div>
              <div>
                <Label htmlFor="ready-date" className="mb-1.5 block">
                  Ready from
                </Label>
                <Input
                  id="ready-date"
                  type="date"
                  value={readyDate}
                  onChange={(e) => setReadyDate(e.target.value)}
                  className="h-11"
                />
                <p className="text-muted-foreground mt-2 text-sm">
                  {readyTarget.guest_name.split(" ")[0]} gets a text with this date and your address.
                  No second appointment is booked — they call or come by.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReadyTarget(null)}>
              Cancel
            </Button>
            <Button onClick={handleMarkReady} disabled={!readyDate || isPending}>
              {isPending ? <Loader2 className="size-4 animate-spin" /> : "Tell the customer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
