"use client";

import { useState, useTransition } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { createService, deleteService, updateService, type ServiceInput } from "@/lib/actions/admin";
import { formatDuration, formatPrice } from "@/lib/format";
import type { Service } from "@/lib/database.types";

const emptyForm: ServiceInput = {
  name: "",
  category: "",
  price: 0,
  durationMinutes: 30,
  description: "",
  active: true,
  sortOrder: 0,
};

export function ServicesManager({ initialServices }: { initialServices: Service[] }) {
  const [services, setServices] = useState(initialServices);
  const [editing, setEditing] = useState<Service | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<ServiceInput>(emptyForm);
  const [isPending, startTransition] = useTransition();

  function openCreate() {
    setForm({ ...emptyForm, sortOrder: services.length });
    setCreating(true);
  }

  function openEdit(service: Service) {
    setForm({
      name: service.name,
      category: service.category,
      price: service.price,
      durationMinutes: service.duration_minutes,
      description: service.description ?? "",
      active: service.active,
      sortOrder: service.sort_order,
    });
    setEditing(service);
  }

  function handleSave() {
    startTransition(async () => {
      try {
        if (editing) {
          await updateService(editing.id, form);
          setServices((prev) =>
            prev.map((s) =>
              s.id === editing.id
                ? {
                    ...s,
                    name: form.name,
                    category: form.category,
                    price: form.price,
                    duration_minutes: form.durationMinutes,
                    description: form.description || null,
                    active: form.active,
                    sort_order: form.sortOrder,
                  }
                : s,
            ),
          );
          toast.success("Service updated.");
          setEditing(null);
        } else {
          const created = await createService(form);
          setServices((prev) => [...prev, created].sort((a, b) => a.sort_order - b.sort_order));
          toast.success("Service added.");
          setCreating(false);
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this service? This can't be undone.")) return;
    startTransition(async () => {
      try {
        await deleteService(id);
        setServices((prev) => prev.filter((s) => s.id !== id));
        toast.success("Service deleted.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  const isOpen = creating || !!editing;

  return (
    <div>
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          Add service
        </Button>
      </div>

      <div className="mt-4 grid gap-3">
        {services.map((service) => (
          <Card key={service.id} className="border-border/60">
            <CardContent className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium">{service.name}</p>
                  {!service.active && <Badge variant="secondary">Hidden</Badge>}
                </div>
                <p className="text-muted-foreground text-sm">
                  {service.category} · {formatDuration(service.duration_minutes)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <p className="font-heading font-semibold whitespace-nowrap">{formatPrice(service.price)}</p>
                <Button variant="ghost" size="icon" onClick={() => openEdit(service)}>
                  <Pencil className="size-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(service.id)} disabled={isPending}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCreating(false);
            setEditing(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit service" : "Add service"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="mb-1.5 block">Name</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="h-11" />
            </div>
            <div>
              <Label className="mb-1.5 block">Category</Label>
              <Input
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                placeholder="e.g. Nails, Hair, Face"
                className="h-11"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-1.5 block">Price ($)</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
                  className="h-11"
                />
              </div>
              <div>
                <Label className="mb-1.5 block">Duration (min)</Label>
                <Input
                  type="number"
                  min={5}
                  step={5}
                  value={form.durationMinutes}
                  onChange={(e) => setForm((f) => ({ ...f, durationMinutes: Number(e.target.value) }))}
                  className="h-11"
                />
              </div>
            </div>
            <div>
              <Label className="mb-1.5 block">Description (optional)</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.active} onCheckedChange={(checked) => setForm((f) => ({ ...f, active: checked }))} />
              <Label>Visible to customers</Label>
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
            <Button onClick={handleSave} disabled={isPending || !form.name.trim() || !form.category.trim()}>
              {isPending ? <Loader2 className="size-4 animate-spin" /> : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
