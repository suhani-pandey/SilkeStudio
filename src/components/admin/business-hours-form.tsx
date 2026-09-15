"use client";

import { useState, useTransition } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { updateBusinessHours } from "@/lib/actions/admin";
import type { BusinessHour } from "@/lib/database.types";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function BusinessHoursForm({ initialHours }: { initialHours: BusinessHour[] }) {
  const [hours, setHours] = useState(() => {
    const byDay = new Map(initialHours.map((h) => [h.day_of_week, h]));
    return Array.from({ length: 7 }, (_, day) => {
      const existing = byDay.get(day);
      return {
        day_of_week: day,
        open_time: existing?.open_time?.slice(0, 5) ?? "10:00",
        close_time: existing?.close_time?.slice(0, 5) ?? "19:00",
        is_closed: existing?.is_closed ?? false,
      };
    });
  });
  const [isPending, startTransition] = useTransition();

  function update(day: number, patch: Partial<(typeof hours)[number]>) {
    setHours((prev) => prev.map((h) => (h.day_of_week === day ? { ...h, ...patch } : h)));
  }

  function handleSave() {
    startTransition(async () => {
      try {
        await Promise.all(
          hours.map((h) =>
            updateBusinessHours(h.day_of_week, {
              openTime: h.is_closed ? null : h.open_time,
              closeTime: h.is_closed ? null : h.close_time,
              isClosed: h.is_closed,
            }),
          ),
        );
        toast.success("Business hours updated.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <div className="space-y-3">
      {hours.map((h) => (
        <div
          key={h.day_of_week}
          className="flex flex-wrap items-center gap-3 rounded-xl border p-3"
        >
          <div className="flex w-32 items-center gap-2">
            <Switch
              checked={!h.is_closed}
              onCheckedChange={(checked) => update(h.day_of_week, { is_closed: !checked })}
            />
            <Label className="font-medium">{DAY_NAMES[h.day_of_week]}</Label>
          </div>
          {h.is_closed ? (
            <span className="text-muted-foreground text-sm">Closed</span>
          ) : (
            <div className="flex items-center gap-2">
              <Input
                type="time"
                value={h.open_time}
                onChange={(e) => update(h.day_of_week, { open_time: e.target.value })}
                className="h-10 w-32"
              />
              <span className="text-muted-foreground text-sm">to</span>
              <Input
                type="time"
                value={h.close_time}
                onChange={(e) => update(h.day_of_week, { close_time: e.target.value })}
                className="h-10 w-32"
              />
            </div>
          )}
        </div>
      ))}
      <Button onClick={handleSave} disabled={isPending}>
        {isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
        Save hours
      </Button>
    </div>
  );
}
