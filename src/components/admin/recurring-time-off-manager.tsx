"use client";

import { useState, useTransition } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createRecurringTimeOff, deleteRecurringTimeOff } from "@/lib/actions/admin";
import type { Database } from "@/lib/database.types";

type RecurringTimeOff = Database["public"]["Tables"]["recurring_time_off"]["Row"];

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function RecurringTimeOffManager({ initialBlocks }: { initialBlocks: RecurringTimeOff[] }) {
  const [blocks, setBlocks] = useState(initialBlocks);
  const [dayOfWeek, setDayOfWeek] = useState("1");
  const [startTime, setStartTime] = useState("14:00");
  const [endTime, setEndTime] = useState("16:00");
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (endTime <= startTime) {
      toast.error("End time must be after start time.");
      return;
    }

    startTransition(async () => {
      try {
        await createRecurringTimeOff({
          dayOfWeek: Number(dayOfWeek),
          startTime,
          endTime,
          reason: reason.trim() || undefined,
        });
        setBlocks((prev) =>
          [
            ...prev,
            {
              id: crypto.randomUUID(),
              day_of_week: Number(dayOfWeek),
              start_time: startTime,
              end_time: endTime,
              reason: reason.trim() || null,
              created_at: new Date().toISOString(),
            },
          ].sort((a, b) => a.day_of_week - b.day_of_week || a.start_time.localeCompare(b.start_time)),
        );
        setReason("");
        toast.success("Weekly time off added.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      try {
        await deleteRecurringTimeOff(id);
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
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleCreate}>
            <div className="sm:col-span-2">
              <Label className="mb-1.5 block">Every</Label>
              <Select value={dayOfWeek} onValueChange={(value) => setDayOfWeek(value ?? "1")}>
                <SelectTrigger className="h-11 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAY_NAMES.map((name, index) => (
                    <SelectItem key={name} value={String(index)}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block">From</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="h-11"
              />
            </div>
            <div>
              <Label className="mb-1.5 block">To</Label>
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="h-11" />
            </div>
            <div className="sm:col-span-2">
              <Label className="mb-1.5 block">
                Reason <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. School run"
                className="h-11"
              />
            </div>
            <Button type="submit" disabled={isPending} className="h-11 sm:col-span-2">
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Add weekly time off
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {blocks.length === 0 && (
          <p className="text-muted-foreground text-sm">
            Nothing repeating yet. Use this for commitments that happen every week.
          </p>
        )}
        {blocks.map((block) => (
          <div key={block.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
            <div className="min-w-0">
              <p className="text-sm font-medium">
                Every {DAY_NAMES[block.day_of_week]} · {block.start_time.slice(0, 5)}–
                {block.end_time.slice(0, 5)}
              </p>
              {block.reason && <p className="text-muted-foreground text-xs">{block.reason}</p>}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-11 shrink-0"
              onClick={() => handleDelete(block.id)}
              disabled={isPending}
              aria-label="Remove"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
