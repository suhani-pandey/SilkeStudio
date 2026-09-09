import Link from "next/link";
import type { Metadata } from "next";
import { addMonths, endOfMonth, format, startOfMonth, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MonthCalendar } from "@/components/admin/month-calendar";
import {
  listAppointments,
  listAvailabilityBlocksInRange,
  listRecurringTimeOff,
} from "@/lib/actions/admin";

export const metadata: Metadata = { title: "Calendar" };

export default async function AdminCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month } = await searchParams;
  const anchor = month ? new Date(`${month}-01T12:00:00`) : new Date();
  const monthStart = startOfMonth(anchor);
  const monthEnd = endOfMonth(anchor);

  // Pad the range so appointments in the leading/trailing week of the grid are included.
  const from = new Date(monthStart);
  from.setDate(from.getDate() - 7);
  const to = new Date(monthEnd);
  to.setDate(to.getDate() + 7);

  const [appointments, blocks, recurring] = await Promise.all([
    listAppointments({ fromISO: from.toISOString(), toISO: to.toISOString() }),
    listAvailabilityBlocksInRange(from.toISOString(), to.toISOString()),
    listRecurringTimeOff(),
  ]);

  const prev = format(subMonths(monthStart, 1), "yyyy-MM");
  const next = format(addMonths(monthStart, 1), "yyyy-MM");

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-medium">{format(monthStart, "MMMM yyyy")}</h1>
          <p className="text-muted-foreground mt-1 text-sm">Tap a day to see what&apos;s on.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="icon" className="size-11">
            <Link href={`/admin/calendar?month=${prev}`} aria-label="Previous month">
              <ChevronLeft className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-11">
            <Link href="/admin/calendar">Today</Link>
          </Button>
          <Button asChild variant="outline" size="icon" className="size-11">
            <Link href={`/admin/calendar?month=${next}`} aria-label="Next month">
              <ChevronRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="mt-6">
        <MonthCalendar
          month={format(monthStart, "yyyy-MM-01")}
          appointments={appointments}
          blocks={blocks}
          recurring={recurring}
        />
      </div>
    </div>
  );
}
