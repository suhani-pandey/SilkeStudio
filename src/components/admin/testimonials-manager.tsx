"use client";

import { useState, useTransition } from "react";
import { Loader2, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  createTestimonial,
  deleteTestimonial,
  updateTestimonial,
  type TestimonialInput,
} from "@/lib/actions/admin";
import type { Testimonial } from "@/lib/database.types";

const emptyForm: TestimonialInput = {
  authorName: "",
  quote: "",
  rating: 5,
  isPublished: true,
  sortOrder: 0,
};

export function TestimonialsManager({ initial }: { initial: Testimonial[] }) {
  const [items, setItems] = useState(initial);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<TestimonialInput>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<Testimonial | null>(null);
  const [isPending, startTransition] = useTransition();

  function openCreate() {
    setForm({ ...emptyForm, sortOrder: items.length });
    setCreating(true);
  }

  function openEdit(item: Testimonial) {
    setForm({
      authorName: item.author_name,
      quote: item.quote,
      rating: item.rating,
      isPublished: item.is_published,
      sortOrder: item.sort_order,
    });
    setEditing(item);
  }

  function handleSave() {
    startTransition(async () => {
      try {
        if (editing) {
          await updateTestimonial(editing.id, form);
          setItems((prev) =>
            prev.map((i) =>
              i.id === editing.id
                ? {
                    ...i,
                    author_name: form.authorName,
                    quote: form.quote,
                    rating: form.rating,
                    is_published: form.isPublished,
                    sort_order: form.sortOrder,
                  }
                : i,
            ),
          );
          toast.success("Review updated.");
          setEditing(null);
        } else {
          const created = await createTestimonial(form);
          setItems((prev) => [...prev, created].sort((a, b) => a.sort_order - b.sort_order));
          toast.success("Review added.");
          setCreating(false);
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      try {
        await deleteTestimonial(id);
        setItems((prev) => prev.filter((i) => i.id !== id));
        setDeleteTarget(null);
        toast.success("Review deleted.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <div>
      <div className="flex justify-end">
        <Button onClick={openCreate} className="h-11">
          <Plus className="size-4" />
          Add review
        </Button>
      </div>

      {items.length === 0 && (
        <p className="text-muted-foreground py-12 text-center text-sm">
          No reviews yet. Add a real one from a client and it appears on the home page.
        </p>
      )}

      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-lg border p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{item.author_name}</p>
                  {!item.is_published && <Badge variant="secondary">Hidden</Badge>}
                  {item.rating && (
                    <span className="text-copper flex gap-0.5">
                      {Array.from({ length: item.rating }).map((_, i) => (
                        <Star key={i} className="fill-copper size-3.5" />
                      ))}
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground mt-1.5 text-sm">{item.quote}</p>
              </div>
              <div className="flex shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-11"
                  aria-label={`Edit review from ${item.author_name}`}
                  onClick={() => openEdit(item)}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-11"
                  aria-label={`Delete review from ${item.author_name}`}
                  onClick={() => setDeleteTarget(item)}
                  disabled={isPending}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete this review?"
        description="It's removed from the home page straight away."
        detail={deleteTarget && <p className="font-medium">{deleteTarget.author_name}</p>}
        confirmLabel="Delete"
        cancelLabel="Keep it"
        isPending={isPending}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget.id)}
      />

      <Dialog
        open={creating || !!editing}
        onOpenChange={(open) => {
          if (!open) {
            setCreating(false);
            setEditing(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit review" : "Add review"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="mb-1.5 block">Client name</Label>
              <Input
                value={form.authorName}
                onChange={(e) => setForm((f) => ({ ...f, authorName: e.target.value }))}
                className="h-11"
              />
            </div>
            <div>
              <Label className="mb-1.5 block">What they said</Label>
              <Textarea
                value={form.quote}
                onChange={(e) => setForm((f) => ({ ...f, quote: e.target.value }))}
                rows={4}
              />
            </div>
            <div>
              <Label className="mb-1.5 block">Rating (1–5, optional)</Label>
              <Input
                type="number"
                min={1}
                max={5}
                value={form.rating ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, rating: e.target.value ? Number(e.target.value) : null }))
                }
                className="h-11"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.isPublished}
                onCheckedChange={(checked) => setForm((f) => ({ ...f, isPublished: checked }))}
              />
              <Label>Show on the website</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreating(false);
                setEditing(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isPending || !form.authorName.trim() || !form.quote.trim()}
            >
              {isPending ? <Loader2 className="size-4 animate-spin" /> : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
