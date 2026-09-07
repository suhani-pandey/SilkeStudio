"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, ChevronLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SlotPicker } from "@/components/admin/slot-picker";
import { getActiveServices } from "@/lib/actions/booking";
import { adminCreateAppointment } from "@/lib/actions/admin";
import { formatDuration, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Service } from "@/lib/database.types";

export default function NewAppointmentPage() {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [slotISO, setSlotISO] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    getActiveServices().then(setServices);
  }, []);

  const selected = useMemo(
    () => services.filter((s) => serviceIds.includes(s.id)),
    [services, serviceIds],
  );
  const totalPrice = selected.reduce((sum, s) => sum + s.price, 0);
  const totalDuration = selected.reduce((sum, s) => sum + s.duration_minutes, 0);

  function toggleService(id: string) {
    setServiceIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    setSlotISO(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (serviceIds.length === 0 || !slotISO || !name.trim() || !phone.trim()) return;

    startTransition(async () => {
      try {
        await adminCreateAppointment({
          serviceIds,
          startAtISO: slotISO,
          guestName: name.trim(),
          guestPhone: phone.trim(),
          guestEmail: email.trim() || undefined,
          notes: notes.trim() || undefined,
        });
        toast.success("Appointment booked.");
        router.push("/admin/appointments");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <div className="mx-auto max-w-lg">
      <Link
        href="/admin/appointments"
        className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 text-sm"
      >
        <ChevronLeft className="size-4" /> Back to appointments
      </Link>
      <h1 className="font-heading text-3xl font-medium">New appointment</h1>
      <p className="text-muted-foreground mt-1">Book this for a walk-in or phone-in customer.</p>

      <Card className="mt-6">
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <Label className="mb-2 block">Services</Label>
              <div className="space-y-2">
                {services.map((service) => {
                  const checked = serviceIds.includes(service.id);
                  return (
                    <button
                      key={service.id}
                      type="button"
                      aria-pressed={checked}
                      onClick={() => toggleService(service.id)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-md border p-3 text-left transition-colors",
                        checked ? "border-primary bg-accent/60" : "border-border hover:border-primary/50",
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-4.5 shrink-0 items-center justify-center rounded border",
                          checked ? "border-primary bg-primary text-primary-foreground" : "border-input",
                        )}
                      >
                        {checked && <Check className="size-3" />}
                      </span>
                      <span className="min-w-0 flex-1 text-sm">
                        <span className="block font-medium">{service.name}</span>
                        <span className="text-muted-foreground">
                          {formatDuration(service.duration_minutes)}
                        </span>
                      </span>
                      <span className="text-sm font-semibold whitespace-nowrap">
                        {formatPrice(service.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
              {selected.length > 0 && (
                <p className="text-muted-foreground mt-3 text-sm">
                  {selected.length} selected · {formatDuration(totalDuration)} ·{" "}
                  <span className="text-foreground font-semibold">{formatPrice(totalPrice)}</span>
                </p>
              )}
            </div>

            <SlotPicker serviceIds={serviceIds} selectedSlotISO={slotISO} onSelectSlot={setSlotISO} />

            <div>
              <Label htmlFor="name" className="mb-2 block">
                Customer name
              </Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required className="h-11" />
            </div>
            <div>
              <Label htmlFor="phone" className="mb-2 block">
                Phone number
              </Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="h-11"
              />
            </div>
            <div>
              <Label htmlFor="email" className="mb-2 block">
                Email <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11" />
            </div>
            <div>
              <Label htmlFor="notes" className="mb-2 block">
                Notes <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </div>

            <Button
              type="submit"
              className="h-12 w-full text-base"
              disabled={isPending || serviceIds.length === 0 || !slotISO || !name.trim() || !phone.trim()}
            >
              {isPending ? <Loader2 className="size-4 animate-spin" /> : "Book appointment"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
