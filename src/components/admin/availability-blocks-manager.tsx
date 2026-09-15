"use client";

import { useMemo, useState, useTransition } from "react";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SALON_TIMEZONE } from "@/lib/business-info";
import { blockTimeOnDate, deleteAvailabilityBlock } from "@/lib/actions/admin";
import type { AvailabilityBlock } from "@/lib/database.types";

/** Today in the salon's timezone, so the date field never opens on yesterday when travelling. */
function salonToday() {
  return formatInTimeZone(new Date(), SALON_TIMEZONE, "yyyy-MM-dd");
}

function dayKey(iso: string) {
  return formatInTimeZone(new Date(iso), SALON_TIMEZONE, "yyyy-MM-dd");
}

export function AvailabilityBlocksManager({
  initialBlocks,
}: {
  initialBlocks: AvailabilityBlock[];
}) {
  const [blocks, setBlocks] = useState(initialBlocks);
  const [date, setDate] = useState(salonToday);
  const [startTime, setStartTime] = useState("14:00");
  const [endTime, setEndTime] = useState("15:00");
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  // Several blocks can sit on one date (2–3pm and 5–6pm), so show them under a single heading.
  const grouped = useMemo(() => {
    const map = new Map<string, AvailabilityBlock[]>();
    for (const block of blocks) {
      const key = dayKey(block.start_at);
      map.set(key, [...(map.get(key) ?? []), block]);
    }
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(
        ([key, list]) =>
          [key, [...list].sort((a, b) => a.start_at.localeCompare(b.start_at))] as const,
      );
  }, [blocks]);

  function addRange(from: string, to: string) {
    if (!date) {
      toast.error("Pick a date first.");
      return;
    }
    if (to <= from) {
      toast.error("End time must be after start time.");
      return;
    }

    startTransition(async () => {
      try {
        await blockTimeOnDate({
          date,
          startTime: from,
          endTime: to,
          reason: reason.trim() || undefined,
        });
        toast.success("Time blocked off.");
        // The server revalidates, but reflect it immediately so adding a second range feels instant.
        setBlocks((prev) =>
          [
            ...prev,
            {
              id: crypto.randomUUID(),
              start_at: fromZonedTime(`${date}T${from}:00`, SALON_TIMEZONE).toISOString(),
              end_at: fromZonedTime(`${date}T${to}:00`, SALON_TIMEZONE).toISOString(),
              reason: reason.trim() || null,
              created_at: new Date().toISOString(),
            },
          ].sort((a, b) => a.start_at.localeCompare(b.start_at)),
        );
        setReason("");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      try {
        await deleteAvailabilityBlock(id);
        setBlocks((prev) => prev.filter((b) => b.id !== id));
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/60">
        <CardContent>
          <form
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              addRange(startTime, endTime);
            }}
          >
            <div className="sm:col-span-2">
              <Label htmlFor="block-date" className="mb-1.5 block">
                Date
              </Label>
              <Input
                id="block-date"
                type="date"
                value={date}
                min={salonToday()}
                onChange={(e) => setDate(e.target.value)}
                className="h-11"
              />
            </div>

            <div>
              <Label htmlFor="block-from" className="mb-1.5 block">
                From
              </Label>
              <Input
                id="block-from"
                type="time"
                step={900}
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="h-11"
              />
            </div>
            <div>
              <Label htmlFor="block-to" className="mb-1.5 block">
                To
              </Label>
              <Input
                id="block-to"
                type="time"
                step={900}
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="h-11"
              />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="block-reason" className="mb-1.5 block">
                Reason <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input
                id="block-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Other work, school run"
                className="h-11"
              />
            </div>

            <Button type="submit" disabled={isPending} className="h-11 sm:col-span-2">
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              Block this time
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => addRange("00:00", "23:59")}
              className="h-11 sm:col-span-2"
            >
              Block the whole day
            </Button>
          </form>

          <p className="text-muted-foreground mt-4 text-sm">
            Blocking one range keeps the date, so you can add another straight away — 2–3pm and
            5–6pm on the same day, for example.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {grouped.length === 0 && (
          <p className="text-muted-foreground text-sm">No upcoming time off.</p>
        )}

        {grouped.map(([key, list]) => (
          <div key={key}>
            <h3 className="text-sm font-semibold">
              {formatInTimeZone(new Date(`${key}T12:00:00Z`), SALON_TIMEZONE, "EEEE d MMMM")}
            </h3>
            <div className="mt-2 space-y-2">
              {list.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between rounded-xl border border-l-4 border-l-red-600 p-3"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {formatInTimeZone(new Date(b.start_at), SALON_TIMEZONE, "HH:mm")} –{" "}
                      {formatInTimeZone(new Date(b.end_at), SALON_TIMEZONE, "HH:mm")}
                    </p>
                    {b.reason && <p className="text-muted-foreground text-xs">{b.reason}</p>}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-11"
                    aria-label="Remove this blocked time"
                    onClick={() => handleDelete(b.id)}
                    disabled={isPending}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
