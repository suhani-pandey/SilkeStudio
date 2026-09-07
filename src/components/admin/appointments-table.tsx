"use client";

import { useMemo, useState, useTransition } from "react";
import { format, isPast } from "date-fns";
import { CalendarClock, Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  const [isPending, startTransition] = useTransition();
  const [rescheduleTarget, setRescheduleTarget] = useState<AppointmentWithServices | null>(null);
  const [newSlotISO, setNewSlotISO] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return appointments
      .filter((a) => {
        const past = isPast(new Date(a.end_at));
        if (filter === "cancelled") return a.status === "cancelled";
        if (filter === "past") return a.status !== "cancelled" && past;
        return a.status !== "cancelled" && !past;
      })
      .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());
  }, [appointments, filter]);

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
      <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mt-4 overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date &amp; time</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground py-10 text-center">
                  No appointments here.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((appt) => (
              <TableRow key={appt.id}>
                <TableCell className="whitespace-nowrap">
                  {format(new Date(appt.start_at), "MMM d, h:mm a")}
                </TableCell>
                <TableCell>
                  <div>{appt.guest_name}</div>
                  <div className="text-muted-foreground text-xs">{appt.guest_phone}</div>
                </TableCell>
                <TableCell className="max-w-56">{appointmentServiceNames(appt)}</TableCell>
                <TableCell>{formatPrice(appt.total_price)}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      appt.status === "cancelled" ? "destructive" : appt.status === "completed" ? "secondary" : "default"
                    }
                  >
                    {appt.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  {appt.status === "confirmed" && (
                    <div className="flex justify-end gap-1.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Reschedule"
                        disabled={isPending}
                        onClick={() => {
                          setRescheduleTarget(appt);
                          setNewSlotISO(null);
                        }}
                      >
                        <CalendarClock className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Mark completed"
                        disabled={isPending}
                        onClick={() => handleStatus(appt.id, "completed")}
                      >
                        <Check className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Cancel"
                        disabled={isPending}
                        onClick={() => {
                          if (confirm("Cancel this appointment?")) handleStatus(appt.id, "cancelled");
                        }}
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

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
