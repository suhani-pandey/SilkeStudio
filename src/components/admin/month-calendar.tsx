"use client";

import { useMemo, useState } from "react";
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { Ban, CalendarX2, Clock, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/format";
import { SALON_TIMEZONE } from "@/lib/business-info";
import { appointmentServiceNames, type AppointmentWithServices } from "@/lib/database.types";
import type { Database } from "@/lib/database.types";

type Block = Database["public"]["Tables"]["availability_blocks"]["Row"];
type Recurring = Database["public"]["Tables"]["recurring_time_off"]["Row"];

interface DayEntry {
  kind: "booked" | "cancelled" | "blocked";
  start: Date;
  end: Date;
  title: string;
  subtitle?: string;
  phone?: string;
  price?: number;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function salonDayKey(date: Date): string {
  return formatInTimeZone(date, SALON_TIMEZONE, "yyyy-MM-dd");
}

function salonTime(date: Date): string {
  return formatInTimeZone(date, SALON_TIMEZONE, "HH:mm");
}

export function MonthCalendar({
  month,
  appointments,
  blocks,
  recurring,
}: {
  month: string; // yyyy-MM-01
  appointments: AppointmentWithServices[];
  blocks: Block[];
  recurring: Recurring[];
}) {
  const monthStart = startOfMonth(new Date(`${month}T12:00:00`));
  const days = eachDayOfInterval({
    start: startOfWeek(monthStart, { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(monthStart), { weekStartsOn: 1 }),
  });

  const [selectedKey, setSelectedKey] = useState<string>(() => {
    const today = salonDayKey(new Date());
    return days.some((d) => salonDayKey(d) === today) ? today : salonDayKey(monthStart);
  });

  // Everything that happens on a given day, keyed by the salon's calendar date.
  const byDay = useMemo(() => {
    const map = new Map<string, DayEntry[]>();
    const push = (key: string, entry: DayEntry) => {
      const list = map.get(key) ?? [];
      list.push(entry);
      map.set(key, list);
    };

    for (const appointment of appointments) {
      const start = new Date(appointment.start_at);
      push(salonDayKey(start), {
        kind: appointment.status === "cancelled" ? "cancelled" : "booked",
        start,
        end: new Date(appointment.end_at),
        title: appointment.guest_name,
        subtitle: appointmentServiceNames(appointment),
        phone: appointment.guest_phone,
        price: appointment.total_price,
      });
    }

    for (const block of blocks) {
      const start = new Date(block.start_at);
      push(salonDayKey(start), {
        kind: "blocked",
        start,
        end: new Date(block.end_at),
        title: block.reason || "Blocked",
      });
    }

    // Weekly commitments don't exist as rows per date, so lay them onto each matching day.
    for (const day of days) {
      const weekday = Number(formatInTimeZone(day, SALON_TIMEZONE, "i")) % 7; // 1=Mon → 0=Sun
      for (const rule of recurring) {
        if (rule.day_of_week !== weekday) continue;
        const key = salonDayKey(day);
        push(key, {
          kind: "blocked",
          start: new Date(`${key}T${rule.start_time.slice(0, 5)}:00`),
          end: new Date(`${key}T${rule.end_time.slice(0, 5)}:00`),
          title: rule.reason || "Weekly time off",
          subtitle: "Repeats weekly",
        });
      }
    }

    for (const list of map.values()) {
      list.sort((a, b) => a.start.getTime() - b.start.getTime());
    }
    return map;
  }, [appointments, blocks, recurring, days]);

  const selectedEntries = byDay.get(selectedKey) ?? [];
  const selectedDate = new Date(`${selectedKey}T12:00:00`);

  return (
    <div>
      {/* Legend */}
      <div className="text-muted-foreground mb-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-emerald-600" /> Booked
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-red-600" /> Blocked / busy
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full border-2 border-red-600" /> Cancelled
        </span>
      </div>

      {/* Month grid */}
      <div className="overflow-hidden rounded-lg border">
        <div className="text-muted-foreground grid grid-cols-7 border-b text-center text-xs font-semibold">
          {WEEKDAYS.map((day) => (
            <div key={day} className="py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {days.map((day) => {
            const key = salonDayKey(day);
            const entries = byDay.get(key) ?? [];
            const booked = entries.filter((e) => e.kind === "booked");
            const blocked = entries.filter((e) => e.kind === "blocked");
            const cancelled = entries.filter((e) => e.kind === "cancelled");
            const outside = !isSameMonth(day, monthStart);

            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedKey(key)}
                aria-pressed={selectedKey === key}
                className={cn(
                  "border-border/70 min-h-20 border-r border-b p-1.5 text-left transition-colors last:border-r-0 sm:min-h-24 sm:p-2",
                  outside && "bg-muted/40",
                  selectedKey === key && "ring-primary bg-accent/50 ring-2 ring-inset",
                )}
              >
                <span
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full text-xs font-semibold",
                    isToday(day) && "bg-primary text-primary-foreground",
                    outside && "text-muted-foreground",
                  )}
                >
                  {formatInTimeZone(day, SALON_TIMEZONE, "d")}
                </span>

                <span className="mt-1 flex flex-wrap gap-1">
                  {booked.slice(0, 3).map((entry, i) => (
                    <span key={`b${i}`} className="size-2 rounded-full bg-emerald-600" />
                  ))}
                  {blocked.length > 0 && <span className="size-2 rounded-full bg-red-600" />}
                  {cancelled.length > 0 && (
                    <span className="size-2 rounded-full border-2 border-red-600" />
                  )}
                  {booked.length > 3 && (
                    <span className="text-muted-foreground text-[0.6rem] leading-none">
                      +{booked.length - 3}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected day */}
      <div className="mt-6">
        <h2 className="font-heading text-xl font-medium">
          {formatInTimeZone(selectedDate, SALON_TIMEZONE, "EEEE d MMMM")}
        </h2>

        {selectedEntries.length === 0 && (
          <p className="text-muted-foreground mt-3 text-sm">Nothing booked or blocked this day.</p>
        )}

        <div className="mt-4 space-y-2">
          {selectedEntries.map((entry, index) => (
            <div
              key={index}
              className={cn(
                "flex items-start gap-3 rounded-lg border-l-4 p-3",
                entry.kind === "booked" && "border-l-emerald-600 bg-emerald-600/5",
                entry.kind === "blocked" && "border-l-red-600 bg-red-600/5",
                entry.kind === "cancelled" && "border-l-red-600/40 bg-muted/50",
              )}
            >
              <div className="mt-0.5 shrink-0">
                {entry.kind === "booked" && <Clock className="size-4 text-emerald-700" />}
                {entry.kind === "blocked" && <Ban className="size-4 text-red-700" />}
                {entry.kind === "cancelled" && <CalendarX2 className="text-muted-foreground size-4" />}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  {salonTime(entry.start)}–{salonTime(entry.end)}
                  {entry.kind === "cancelled" && (
                    <span className="text-muted-foreground ml-2 font-normal">cancelled</span>
                  )}
                </p>
                <p className={cn("mt-0.5", entry.kind === "cancelled" && "text-muted-foreground line-through")}>
                  {entry.title}
                </p>
                {entry.subtitle && (
                  <p className="text-muted-foreground mt-0.5 text-sm">{entry.subtitle}</p>
                )}
                {entry.phone && (
                  <a
                    href={`tel:${entry.phone.replace(/\s/g, "")}`}
                    className="text-muted-foreground hover:text-plum mt-1 inline-flex min-h-9 items-center gap-1.5 text-sm"
                  >
                    <Phone className="size-3.5" />
                    {entry.phone}
                  </a>
                )}
              </div>

              {entry.price !== undefined && entry.kind === "booked" && (
                <span className="font-heading shrink-0 font-semibold">{formatPrice(entry.price)}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}