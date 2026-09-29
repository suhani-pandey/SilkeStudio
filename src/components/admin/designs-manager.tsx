"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { designImageUrl } from "@/lib/nail-designs";
import {
  createNailDesign,
  deleteNailDesign,
  updateNailDesign,
  type NailDesignInput,
} from "@/lib/actions/admin";
import type { NailDesign, Service } from "@/lib/database.types";

const emptyForm: NailDesignInput = {
  name: "",
  nameDa: "",
  category: "",
  categoryDa: "",
  description: "",
  descriptionDa: "",
  imagePath: "",
  colourHex: "",
  serviceId: null,
  active: true,
  sortOrder: 0,
};

const MAX_BYTES = 5 * 1024 * 1024;

export function DesignsManager({
  initialDesigns,
  services,
}: {
  initialDesigns: NailDesign[];
  services: Service[];
}) {
  const [designs, setDesigns] = useState(initialDesigns);
  const [form, setForm] = useState<NailDesignInput>(emptyForm);
  const [editing, setEditing] = useState<NailDesign | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<NailDesign | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);

  const isOpen = creating || !!editing;

  function openCreate() {
    setForm({ ...emptyForm, sortOrder: designs.length });
    setCreating(true);
  }

  function openEdit(design: NailDesign) {
    setForm({
      name: design.name,
      nameDa: design.name_da ?? "",
      category: design.category,
      categoryDa: design.category_da ?? "",
      description: design.description ?? "",
      descriptionDa: design.description_da ?? "",
      imagePath: design.image_path,
      colourHex: design.colour_hex ?? "",
      serviceId: design.service_id,
      active: design.active,
      sortOrder: design.sort_order,
    });
    setEditing(design);
  }

  /** Uploads straight to storage from the browser, so a large photo never passes through the server. */
  async function handleFile(file: File) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Please choose a JPG, PNG or WebP photo.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("That photo is over 5 MB — try a smaller one.");
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${crypto.randomUUID()}.${extension}`;
      const { error } = await supabase.storage.from("nail-designs").upload(path, file, {
        cacheControl: "31536000",
        upsert: false,
      });
      if (error) throw new Error(error.message);

      setForm((f) => ({ ...f, imagePath: path }));
      toast.success("Photo uploaded.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function handleSave() {
    if (!form.name.trim() || !form.category.trim() || !form.imagePath) {
      toast.error("A name, a category and a photo are needed.");
      return;
    }

    startTransition(async () => {
      try {
        if (editing) {
          await updateNailDesign(editing.id, form);
          setDesigns((prev) =>
            prev.map((d) =>
              d.id === editing.id
                ? {
                    ...d,
                    name: form.name,
                    category: form.category,
                    image_path: form.imagePath,
                    colour_hex: form.colourHex || null,
                    active: form.active,
                  }
                : d,
            ),
          );
        } else {
          await createNailDesign(form);
        }
        toast.success(editing ? "Design updated." : "Design added.");
        setCreating(false);
        setEditing(null);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  function handleDelete(design: NailDesign) {
    startTransition(async () => {
      try {
        await deleteNailDesign(design.id, design.image_path);
        setDesigns((prev) => prev.filter((d) => d.id !== design.id));
        toast.success("Design removed.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <div>
      <Button onClick={openCreate} className="h-11">
        <ImagePlus className="size-4" />
        Add design
      </Button>

      {designs.length === 0 && (
        <p className="text-muted-foreground py-16 text-center text-sm">
          No designs yet. Add a few photos of your own work and they appear on the site.
        </p>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {designs.map((design) => (
          <Card key={design.id} className="border-border/60">
            <CardContent className="flex gap-4">
              <div className="bg-muted relative size-20 shrink-0 overflow-hidden rounded-lg">
                <Image
                  src={designImageUrl(design.image_path)}
                  alt={design.name}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{design.name}</p>
                <p className="text-muted-foreground text-sm">{design.category}</p>
                {!design.active && (
                  <Badge variant="secondary" className="mt-1.5">
                    Hidden
                  </Badge>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-11"
                  aria-label={`Edit ${design.name}`}
                  onClick={() => openEdit(design)}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-11"
                  aria-label={`Delete ${design.name}`}
                  onClick={() => setDeleteTarget(design)}
                  disabled={isPending}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Remove this design?"
        description="It disappears from the website, and the photo is deleted."
        detail={deleteTarget && <p className="font-medium">{deleteTarget.name}</p>}
        confirmLabel="Remove"
        cancelLabel="Keep it"
        isPending={isPending}
        onConfirm={() => {
          if (deleteTarget) handleDelete(deleteTarget);
          setDeleteTarget(null);
        }}
      />

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
            <DialogTitle>{editing ? "Edit design" : "Add design"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="design-photo-button" className="mb-1.5 block">
                Photo
              </Label>
              <div className="flex items-center gap-4">
                <div className="bg-muted relative size-24 shrink-0 overflow-hidden rounded-lg">
                  {form.imagePath && (
                    <Image
                      src={designImageUrl(form.imagePath)}
                      alt=""
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  )}
                </div>
                <div>
                  <input
                    ref={fileInput}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleFile(file);
                      e.target.value = "";
                    }}
                  />
                  <Button
                    id="design-photo-button"
                    type="button"
                    variant="outline"
                    className="h-11"
                    disabled={uploading}
                    onClick={() => fileInput.current?.click()}
                  >
                    {uploading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <ImagePlus className="size-4" />
                    )}
                    {form.imagePath ? "Replace photo" : "Choose photo"}
                  </Button>
                  <p className="text-muted-foreground mt-1.5 text-xs">
                    JPG, PNG or WebP, up to 5 MB.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="design-name" className="mb-1.5 block">
                  Name
                </Label>
                <Input
                  id="design-name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Pink chrome French"
                  className="h-11"
                />
              </div>
              <div>
                <Label htmlFor="design-category" className="mb-1.5 block">
                  Category
                </Label>
                <Input
                  id="design-category"
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  placeholder="e.g. Gel, Acrylic, Extensions"
                  className="h-11"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="design-name-da" className="mb-1.5 block">
                  Name (Dansk)
                </Label>
                <Input
                  id="design-name-da"
                  value={form.nameDa ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, nameDa: e.target.value }))}
                  className="h-11"
                />
              </div>
              <div>
                <Label htmlFor="design-category-da" className="mb-1.5 block">
                  Category (Dansk)
                </Label>
                <Input
                  id="design-category-da"
                  value={form.categoryDa ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, categoryDa: e.target.value }))}
                  className="h-11"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="design-description" className="mb-1.5 block">
                Description <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Textarea
                id="design-description"
                value={form.description ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="design-colour" className="mb-1.5 block">
                  Main colour <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Input
                  id="design-colour"
                  type="color"
                  value={form.colourHex || "#ad5238"}
                  onChange={(e) => setForm((f) => ({ ...f, colourHex: e.target.value }))}
                  className="h-11 w-20 p-1"
                />
              </div>
              <div>
                <Label htmlFor="design-service" className="mb-1.5 block">
                  Booked as
                </Label>
                <select
                  id="design-service"
                  value={form.serviceId ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, serviceId: e.target.value || null }))}
                  className="border-input bg-background h-11 w-full rounded-md border px-3 text-sm"
                >
                  <option value="">No specific service</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="design-active">Show on the website</Label>
              <Switch
                id="design-active"
                checked={form.active}
                onCheckedChange={(checked) => setForm((f) => ({ ...f, active: checked }))}
              />
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
            <Button onClick={handleSave} disabled={isPending || uploading}>
              {isPending ? <Loader2 className="size-4 animate-spin" /> : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
