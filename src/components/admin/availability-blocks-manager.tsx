"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createAvailabilityBlock, deleteAvailabilityBlock } from "@/lib/actions/admin";
import type { AvailabilityBlock } from "@/lib/database.types";

function toLocalInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function AvailabilityBlocksManager({ initialBlocks }: { initialBlocks: AvailabilityBlock[] }) {
  const [blocks, setBlocks] = useState(initialBlocks);
  const now = new Date();
  const [start, setStart] = useState(toLocalInputValue(now));
  const [end, setEnd] = useState(toLocalInputValue(new Date(now.getTime() + 60 * 60 * 1000)));
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!start || !end) return;
    const startAt = new Date(start);
    const endAt = new Date(end);
    if (endAt <= startAt) {
      toast.error("End time must be after start time.");
      return;
    }

    startTransition(async () => {
      try {
        await createAvailabilityBlock({
          startAtISO: startAt.toISOString(),
          endAtISO: endAt.toISOString(),
          reason: reason.trim() || undefined,
        });
        setBlocks((prev) =>
          [
            ...prev,
            { id: crypto.randomUUID(), start_at: startAt.toISOString(), end_at: endAt.toISOString(), reason, created_at: new Date().toISOString() },
          ].sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime()),
        );
        setReason("");
        toast.success("Time blocked off.");
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
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleCreate}>
            <div>
              <Label className="mb-1.5 block">From</Label>
              <Input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} className="h-11" />
            </div>
            <div>
              <Label className="mb-1.5 block">To</Label>
              <Input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} className="h-11" />
            </div>
            <div className="sm:col-span-2">
              <Label className="mb-1.5 block">
                Reason <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Other work, day off" className="h-11" />
            </div>
            <Button type="submit" disabled={isPending} className="sm:col-span-2">
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Block off this time
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {blocks.length === 0 && <p className="text-muted-foreground text-sm">No upcoming time off.</p>}
        {blocks.map((b) => (
          <div key={b.id} className="flex items-center justify-between rounded-xl border p-3">
            <div>
              <p className="text-sm font-medium">
                {format(new Date(b.start_at), "EEE, MMM d 'at' h:mm a")} – {format(new Date(b.end_at), "h:mm a")}
              </p>
              {b.reason && <p className="text-muted-foreground text-xs">{b.reason}</p>}
            </div>
            <Button variant="ghost" size="icon" onClick={() => handleDelete(b.id)} disabled={isPending}>
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
