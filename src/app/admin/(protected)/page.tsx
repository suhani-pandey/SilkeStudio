import Link from "next/link";
import type { Metadata } from "next";
import { CalendarPlus, Clock, Phone, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { listAppointmentsForDay, listAppointments } from "@/lib/actions/admin";
import { formatPrice } from "@/lib/format";
import { ConfirmationFlag } from "@/components/admin/confirmation-flag";
import { formatSalon, salonDayKeyOffset, salonDayRange } from "@/lib/salon-time";
import { appointmentServiceNames } from "@/lib/database.types";

export const metadata: Metadata = { title: "Dashboard" };

export default async function AdminDashboardPage() {
  // "Today" and the next seven days are the studio's days. The server runs in UTC, which would
  // otherwise put the day boundary at 01:00 or 02:00 in Høje Taastrup.
  const now = new Date();
  const upcomingFrom = salonDayRange(salonDayKeyOffset(now, 1)).from;
  const upcomingTo = salonDayRange(salonDayKeyOffset(now, 7)).to;
  const [today, upcoming] = await Promise.all([
    listAppointmentsForDay(now),
    listAppointments({ fromISO: upcomingFrom.toISOString(), toISO: upcomingTo.toISOString() }),
  ]);

  const todayActive = today.filter((a) => a.status !== "cancelled");
  const upcomingActive = upcoming.filter((a) => a.status !== "cancelled").slice(0, 8);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold sm:text-3xl">Good day 👋</h1>
          <p className="text-muted-foreground mt-1">
            Here&apos;s what&apos;s happening at the salon.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/appointments/new">
            <CalendarPlus className="size-4" />
            New appointment
          </Link>
        </Button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Card className="border-border/60">
          <CardContent>
            <p className="text-muted-foreground text-sm">Today&apos;s appointments</p>
            <p className="font-heading mt-1 text-3xl font-semibold">{todayActive.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent>
            <p className="text-muted-foreground text-sm">Next 7 days</p>
            <p className="font-heading mt-1 text-3xl font-semibold">{upcomingActive.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-10">
        <h2 className="font-heading text-xl font-semibold">Today</h2>
        <div className="mt-4 space-y-3">
          {todayActive.length === 0 && (
            <p className="text-muted-foreground py-8 text-center text-sm">No appointments today.</p>
          )}
          {todayActive.map((appt) => (
            <Card key={appt.id} className="border-border/60">
              <CardContent className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="bg-accent flex size-10 items-center justify-center rounded-full">
                    <Clock className="text-accent-foreground size-4.5" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {formatSalon(appt.start_at, "HH:mm")} — {appt.guest_name}
                    </p>
                    <p className="text-muted-foreground flex items-center gap-3 text-sm">
                      <span className="flex items-center gap-1">
                        <Scissors className="size-3.5" /> {appointmentServiceNames(appt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="size-3.5" /> {appt.guest_phone}
                      </span>
                    </p>
                    <ConfirmationFlag
                      status={appt.confirmation_status}
                      guestName={appt.guest_name}
                    />
                  </div>
                </div>
                <p className="font-heading font-semibold">{formatPrice(appt.total_price)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-xl font-semibold">Coming up</h2>
          <Link href="/admin/calendar" className="text-primary text-sm font-medium">
            View calendar →
          </Link>
        </div>
        <div className="mt-4 space-y-3">
          {upcomingActive.length === 0 && (
            <p className="text-muted-foreground py-8 text-center text-sm">
              Nothing booked in the next week.
            </p>
          )}
          {upcomingActive.map((appt) => (
            <Card key={appt.id} className="border-border/60">
              <CardContent className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{appt.guest_name}</p>
                  <p className="text-muted-foreground text-sm">
                    {appointmentServiceNames(appt)} ·{" "}
                    {formatSalon(appt.start_at, "EEE d MMM 'at' HH:mm")}
                  </p>
                </div>
                <p className="font-heading font-semibold">{formatPrice(appt.total_price)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
