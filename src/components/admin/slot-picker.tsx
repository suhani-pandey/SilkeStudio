"use client";

import { useEffect, useState } from "react";
import { format, isSameDay } from "date-fns";
import { Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { getAvailableSlots } from "@/lib/actions/booking";
import { nextBookableDays } from "@/lib/dates";

interface SlotPickerProps {
  serviceIds: string[];
  excludeAppointmentId?: string;
  selectedSlotISO: string | null;
  onSelectSlot: (iso: string) => void;
}

export function SlotPicker({
  serviceIds,
  excludeAppointmentId,
  selectedSlotISO,
  onSelectSlot,
}: SlotPickerProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(() => nextBookableDays(1)[0]);
  const [result, setResult] = useState<{ key: string; slots: string[] } | null>(null);
  const days = nextBookableDays(21);

  const hasServices = serviceIds.length > 0;
  const requestKey = hasServices
    ? `${[...serviceIds].sort().join(",")}|${selectedDate.toDateString()}|${excludeAppointmentId ?? ""}`
    : null;

  useEffect(() => {
    if (!requestKey) return;
    let cancelled = false;
    getAvailableSlots(serviceIds, selectedDate.toISOString(), excludeAppointmentId).then((slots) => {
      if (!cancelled) setResult({ key: requestKey, slots });
    });
    return () => {
      cancelled = true;
    };
  }, [serviceIds, selectedDate, excludeAppointmentId, requestKey]);

  if (!hasServices) {
    return <p className="text-muted-foreground text-sm">Pick at least one service first.</p>;
  }

  const loading = result?.key !== requestKey;
  const slots = loading ? [] : result.slots;

  return (
    <div>
      <Label className="mb-2 block">Pick a day</Label>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {days.map((day) => (
          <button
            key={day.toISOString()}
            type="button"
            onClick={() => setSelectedDate(day)}
            className={cn(
              "flex min-w-14 flex-col items-center rounded-md border px-2.5 py-2 text-sm transition-colors",
              isSameDay(day, selectedDate)
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border hover:border-primary/50",
            )}
          >
            <span className="text-xs opacity-80">{format(day, "EEE")}</span>
            <span className="font-semibold">{format(day, "d")}</span>
          </button>
        ))}
      </div>

      <Label className="mt-4 mb-2 block">Pick a time</Label>
      {loading ? (
        <div className="text-muted-foreground flex items-center gap-2 py-6 text-sm">
          <Loader2 className="size-4 animate-spin" /> Loading…
        </div>
      ) : slots.length === 0 ? (
        <p className="text-muted-foreground py-6 text-sm">No times available this day.</p>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {slots.map((iso) => (
            <button
              key={iso}
              type="button"
              onClick={() => onSelectSlot(iso)}
              className={cn(
                "rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                selectedSlotISO === iso
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border hover:border-primary/50",
              )}
            >
              {format(new Date(iso), "HH:mm")}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
