import Link from "next/link";
import type { Metadata } from "next";
import { addDays, format, isToday, startOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listAppointments } from "@/lib/actions/admin";
import { formatPrice } from "@/lib/format";
import { appointmentServiceNames } from "@/lib/database.types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Calendar" };

export default async function AdminCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string }>;
}) {
  const params = await searchParams;
  const startParam = typeof params.start === "string" ? params.start : undefined;
  const weekStart = startOfWeek(startParam ? new Date(startParam) : new Date(), { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const appointments = await listAppointments({
    fromISO: weekStart.toISOString(),
    toISO: addDays(weekStart, 7).toISOString(),
  });
  const active = appointments.filter((a) => a.status !== "cancelled");

  const prevWeek = addDays(weekStart, -7).toISOString();
  const nextWeek = addDays(weekStart, 7).toISOString();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-heading text-2xl font-semibold sm:text-3xl">Calendar</h1>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="icon">
            <Link href={`/admin/calendar?start=${encodeURIComponent(prevWeek)}`} aria-label="Previous week">
              <ChevronLeft className="size-4" />
            </Link>
          </Button>
          <span className="text-sm font-medium">
            {format(weekStart, "MMM d")} – {format(addDays(weekStart, 6), "MMM d, yyyy")}
          </span>
          <Button asChild variant="outline" size="icon">
            <Link href={`/admin/calendar?start=${encodeURIComponent(nextWeek)}`} aria-label="Next week">
              <ChevronRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
        {days.map((day) => {
          const dayAppointments = active
            .filter((a) => format(new Date(a.start_at), "yyyy-MM-dd") === format(day, "yyyy-MM-dd"))
            .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());

          return (
            <div
              key={day.toISOString()}
              className={cn("rounded-xl border p-3", isToday(day) ? "border-primary bg-primary/5" : "border-border/60")}
            >
              <p className={cn("text-sm font-semibold", isToday(day) && "text-primary")}>{format(day, "EEE d")}</p>
              <div className="mt-2 space-y-2">
                {dayAppointments.length === 0 && <p className="text-muted-foreground text-xs">No bookings</p>}
                {dayAppointments.map((appt) => (
                  <div key={appt.id} className="bg-secondary/50 rounded-lg p-2 text-xs">
                    <p className="font-medium">{format(new Date(appt.start_at), "h:mm a")}</p>
                    <p className="truncate">{appt.guest_name}</p>
                    <p className="text-muted-foreground truncate">{appointmentServiceNames(appt)}</p>
                    <p className="text-muted-foreground">{formatPrice(appt.total_price)}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
