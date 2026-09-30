"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format, isSameDay } from "date-fns";
import { formatSalon } from "@/lib/salon-time";
import { Check, ChevronLeft, Loader2, PackageOpen, Timer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { formatDuration, formatPrice } from "@/lib/format";
import { createBooking, getAvailableSlots } from "@/lib/actions/booking";
import { checkPhone, isEmailSyntaxValid, suggestEmailFix } from "@/lib/contact-validation";
import { TurnstileWidget, turnstileEnabled } from "@/components/booking/turnstile-widget";
import { BookingPolicy } from "@/components/booking/booking-policy";
import { nextBookableDays } from "@/lib/dates";
import type { BookingSummary } from "@/lib/booking-summary";
import type { Fulfilment, Service, ServiceLine } from "@/lib/database.types";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { dateLocale } from "@/lib/date-locale";
import { categoryLabelFor, serviceName } from "@/lib/service-locale";

interface BookingWizardProps {
  services: Service[];
  defaultContact?: { fullName: string; phone: string; email: string };
  t: Dictionary["booking"];
  /** House rules, shown just before the customer confirms. */
  policy: Dictionary["policy"];
  locale: Locale;
  /** Category to show first, when the visitor arrived from a category card. */
  initialCategory?: string;
  /** Which side of the business to open on, when the visitor arrived from a specific card. */
  initialLine?: ServiceLine;
  /** A design chosen from the catalogue, carried into the note so she knows what to prepare. */
  initialDesign?: string;
}

type Step = 1 | 2 | 3;

export function BookingWizard({
  services,
  defaultContact,
  t,
  policy,
  locale,
  initialCategory,
  initialLine,
  initialDesign,
}: BookingWizardProps) {
  const df = { locale: dateLocale(locale) };
  const steps: { id: Step; label: string }[] = [
    { id: 1, label: t.stepServices },
    { id: 2, label: t.stepDateTime },
    { id: 3, label: t.stepDetails },
  ];

  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [line, setLine] = useState<ServiceLine>(initialLine ?? "beauty");
  const [fulfilment, setFulfilment] = useState<Fulfilment>("appointment");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(() => nextBookableDays(1)[0]);
  const [selectedSlotISO, setSelectedSlotISO] = useState<string | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [name, setName] = useState(defaultContact?.fullName ?? "");
  const [phone, setPhone] = useState(defaultContact?.phone ?? "");
  const [email, setEmail] = useState(defaultContact?.email ?? "");
  const [notes, setNotes] = useState(initialDesign ? `Design: ${initialDesign}` : "");
  const [isSubmitting, startSubmit] = useTransition();
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  // Errors appear once a field has been left, not while someone is still typing into it.
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [turnstileReset, setTurnstileReset] = useState(0);

  const days = useMemo(() => nextBookableDays(21), []);

  const hasTailoring = useMemo(
    () => services.some((s) => s.service_line === "tailoring"),
    [services],
  );

  const grouped = useMemo(() => {
    const byCategory = services
      .filter((service) => (service.service_line ?? "beauty") === line)
      .reduce<Record<string, Service[]>>((acc, service) => {
        (acc[service.category] ??= []).push(service);
        return acc;
      }, {});
    if (!initialCategory || !byCategory[initialCategory]) return byCategory;
    // Lead with the category they tapped, without hiding the others.
    const { [initialCategory]: first, ...rest } = byCategory;
    return { [initialCategory]: first, ...rest };
  }, [services, initialCategory, line]);

  const selectedServices = useMemo(
    () => services.filter((s) => selectedIds.includes(s.id)),
    [services, selectedIds],
  );
  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const totalDuration = selectedServices.reduce(
    (sum, s) => sum + (fulfilment === "dropoff" ? (s.dropoff_minutes ?? 15) : s.duration_minutes),
    0,
  );
  const phoneValid = checkPhone(phone).valid;
  const emailValid = isEmailSyntaxValid(email);
  const emailSuggestion = emailValid ? suggestEmailFix(email) : null;
  const detailsComplete = name.trim().length > 0 && phoneValid && emailValid;
  const isTailoring = line === "tailoring";
  const canDropOff =
    isTailoring &&
    selectedServices.length > 0 &&
    selectedServices.every((s) => s.dropoff_minutes != null);

  function switchLine(next: ServiceLine) {
    if (next === line) return;
    setLine(next);
    setSelectedIds([]);
    setSelectedSlotISO(null);
    // Only garments can be left behind, so leaving the tailoring side resets the choice.
    if (next === "beauty") setFulfilment("appointment");
  }

  function chooseFulfilment(next: Fulfilment) {
    setFulfilment(next);
    setSelectedSlotISO(null);
    if (step === 2) loadSlots(selectedIds, selectedDate, next);
  }

  function toggleService(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    setSelectedSlotISO(null);
  }

  async function loadSlots(ids: string[], date: Date, mode: Fulfilment = fulfilment) {
    setSlotsLoading(true);
    setSelectedSlotISO(null);
    try {
      setSlots(await getAvailableSlots(ids, date.toISOString(), undefined, mode));
    } catch {
      toast.error(t.loadError);
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  }

  function goToDateStep() {
    setStep(2);
    loadSlots(selectedIds, selectedDate);
  }

  function handleSelectDate(date: Date) {
    setSelectedDate(date);
    loadSlots(selectedIds, date);
  }

  function failBooking(message: string, code?: string) {
    toast.error(message);
    // A bot-check token is single-use, so a failed attempt needs a fresh one.
    setTurnstileToken(null);
    setTurnstileReset((n) => n + 1);

    // The details form only shows while a slot is chosen, and reloading slots clears the choice —
    // so only do that when the slot itself was the problem, and step back to pick a new one.
    // Anything else (a bad email, a booking limit) keeps them on the form with what they typed.
    if (code === "SLOT_TAKEN") {
      setStep(2);
      loadSlots(selectedIds, selectedDate);
    }
  }

  function handleSubmit() {
    if (!selectedSlotISO || !detailsComplete) {
      setPhoneTouched(true);
      setEmailTouched(true);
      return;
    }

    startSubmit(async () => {
      try {
        const result = await createBooking({
          serviceIds: selectedIds,
          startAtISO: selectedSlotISO,
          guestName: name.trim(),
          guestPhone: phone.trim(),
          guestEmail: email.trim(),
          notes: notes.trim() || undefined,
          fulfilment,
          turnstileToken: turnstileToken ?? undefined,
        });
        if (!result.ok) {
          failBooking(result.error, result.code);
          return;
        }
        const { reference, confirmation } = result.data;
        const summary: BookingSummary = {
          fulfilment,
          confirmation,
          serviceNames: selectedServices.map((s) => serviceName(s, locale)),
          totalPrice,
          durationMinutes: totalDuration,
          startAtISO: selectedSlotISO,
          guestName: name.trim(),
          reference,
        };
        sessionStorage.setItem("lastBooking", JSON.stringify(summary));
        router.push("/book/confirmation");
      } catch {
        // Only reached if the request itself failed, e.g. no connection.
        failBooking(t.submitError);
      }
    });
  }

  return (
    <div className="mx-auto max-w-3xl px-5 pb-40 sm:px-6">
      {/* Stepper */}
      <ol className="mb-10 flex items-center justify-center gap-2 sm:mb-12 sm:gap-6">
        {steps.map(({ id, label }, i) => (
          <li key={id} className="flex items-center gap-3 sm:gap-6">
            <div className="flex items-center gap-2.5">
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-full border text-xs font-semibold",
                  step === id && "border-primary bg-primary text-primary-foreground",
                  step > id && "border-copper text-copper-deep",
                  step < id && "text-muted-foreground border-border",
                )}
              >
                {step > id ? <Check className="size-3.5" /> : id}
              </span>
              <span
                className={cn(
                  "hidden text-xs font-semibold tracking-[0.15em] uppercase sm:inline",
                  step === id ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && <span className="bg-border h-px w-6 sm:w-10" />}
          </li>
        ))}
      </ol>

      {/* Step 1 — services */}
      {step === 1 && (
        <div className="space-y-10">
          {/* Two halves of the business. A single visit belongs to one or the other, so switching
              here starts the basket over rather than quietly mixing hair with hemming. */}
          {hasTailoring && (
            <div className="bg-muted flex rounded-lg p-1" role="group" aria-label={t.lineLabel}>
              {(["beauty", "tailoring"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={line === value}
                  onClick={() => switchLine(value)}
                  className={cn(
                    "flex-1 rounded-md px-4 py-3 text-sm font-medium transition-colors",
                    line === value
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {value === "beauty" ? t.lineBeauty : t.lineTailoring}
                </button>
              ))}
            </div>
          )}

          {/* Alterations can be waited for or left behind; the choice changes how much of her
              day the booking takes, so it has to be made before a time is picked. */}
          {isTailoring && selectedIds.length > 0 && canDropOff && (
            <div>
              <h2 className="font-heading text-2xl font-medium">{t.fulfilmentTitle}</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  {
                    value: "appointment" as const,
                    icon: Timer,
                    title: t.waitTitle,
                    body: t.waitBody,
                  },
                  {
                    value: "dropoff" as const,
                    icon: PackageOpen,
                    title: t.dropoffTitle,
                    body: t.dropoffBody,
                  },
                ].map(({ value, icon: Icon, title, body }) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={fulfilment === value}
                    onClick={() => chooseFulfilment(value)}
                    className={cn(
                      "flex gap-3 rounded-lg border p-4 text-left transition-colors",
                      fulfilment === value
                        ? "border-primary bg-accent/60"
                        : "border-border hover:border-primary/50",
                    )}
                  >
                    <Icon className="text-copper-deep mt-0.5 size-5 shrink-0" />
                    <span>
                      <span className="block font-medium">{title}</span>
                      <span className="text-muted-foreground text-sm">{body}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              <h2 className="font-heading border-copper/40 border-b pb-3 text-2xl font-medium">
                {categoryLabelFor(services, category, locale)}
              </h2>
              <div className="mt-4 space-y-2">
                {items.map((service) => {
                  const checked = selectedIds.includes(service.id);
                  return (
                    <button
                      key={service.id}
                      type="button"
                      aria-pressed={checked}
                      onClick={() => toggleService(service.id)}
                      className={cn(
                        "flex w-full items-center gap-4 rounded-lg border p-4 text-left transition-colors active:scale-[0.99]",
                        checked
                          ? "border-primary bg-accent/60"
                          : "border-border hover:border-primary/50",
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-5 shrink-0 items-center justify-center rounded border",
                          checked
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-input",
                        )}
                      >
                        {checked && <Check className="size-3.5" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium">{serviceName(service, locale)}</span>
                        <span className="text-muted-foreground text-sm">
                          {formatDuration(
                            fulfilment === "dropoff"
                              ? (service.dropoff_minutes ?? 15)
                              : service.duration_minutes,
                          )}
                        </span>
                      </span>
                      <span className="font-heading text-lg font-semibold whitespace-nowrap">
                        {formatPrice(service.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Step 2 — date & time */}
      {step === 2 && (
        <div>
          <button
            type="button"
            onClick={() => setStep(1)}
            className="text-muted-foreground hover:text-foreground mb-8 inline-flex items-center gap-1.5 text-sm"
          >
            <ChevronLeft className="size-4" /> {t.changeServices}
          </button>

          <Label className="eyebrow">{t.pickDay}</Label>
          <div className="snap-row -mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-2 sm:mx-0 sm:px-0">
            {days.map((day) => (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => handleSelectDate(day)}
                className={cn(
                  "flex min-w-[4.5rem] shrink-0 flex-col items-center rounded-lg border px-3 py-3 transition-colors",
                  isSameDay(day, selectedDate)
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:border-primary/50",
                )}
              >
                <span className="text-xs opacity-80">{format(day, "EEE", df)}</span>
                <span className="mt-0.5 text-lg font-semibold">{format(day, "d")}</span>
                <span className="text-xs opacity-80">{format(day, "MMM", df)}</span>
              </button>
            ))}
          </div>

          <Label className="eyebrow mt-10 block">{t.pickTime}</Label>
          {slotsLoading ? (
            <div className="text-muted-foreground flex items-center gap-2 py-10 text-sm">
              <Loader2 className="size-4 animate-spin" /> {t.loadingTimes}
            </div>
          ) : slots.length === 0 ? (
            <p className="text-muted-foreground py-10 text-sm">{t.noTimes}</p>
          ) : (
            <div className="mt-4 grid grid-cols-3 gap-2.5 sm:grid-cols-4">
              {slots.map((iso) => (
                <button
                  key={iso}
                  type="button"
                  onClick={() => setSelectedSlotISO(iso)}
                  className={cn(
                    "min-h-12 rounded-lg border text-sm font-medium transition-colors",
                    selectedSlotISO === iso
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:border-primary/50",
                  )}
                >
                  {formatSalon(iso, "HH:mm")}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 3 — details */}
      {step === 3 && selectedSlotISO && (
        <div>
          <button
            type="button"
            onClick={() => setStep(2)}
            className="text-muted-foreground hover:text-foreground mb-8 inline-flex items-center gap-1.5 text-sm"
          >
            <ChevronLeft className="size-4" /> {t.changeDateTime}
          </button>

          <div className="bg-secondary/60 rounded-md p-5">
            <p className="eyebrow">{t.yourBooking}</p>
            <p className="font-heading mt-2 text-2xl font-medium">
              {formatSalon(selectedSlotISO, t.dateFormat, df)}
            </p>
            <ul className="text-muted-foreground mt-4 space-y-1 text-sm">
              {selectedServices.map((s) => (
                <li key={s.id} className="flex justify-between gap-4">
                  <span>{serviceName(s, locale)}</span>
                  <span>{formatPrice(s.price)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex justify-between border-t pt-3 font-medium">
              <span>
                {t.total} · {formatDuration(totalDuration)}
              </span>
              <span className="font-heading text-lg font-semibold">{formatPrice(totalPrice)}</span>
            </div>
          </div>

          <form
            className="mt-8 space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
          >
            <p className="text-muted-foreground text-sm">
              <span aria-hidden className="text-clay">
                *
              </span>{" "}
              {t.requiredNote}
            </p>

            <div>
              <Label htmlFor="name" className="mb-2 block">
                {t.fullName}{" "}
                <span aria-hidden className="text-clay">
                  *
                </span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                aria-required="true"
                autoComplete="name"
                maxLength={120}
                className="h-12"
              />
            </div>
            <div>
              <Label htmlFor="phone" className="mb-2 block">
                {t.phone}{" "}
                <span aria-hidden className="text-clay">
                  *
                </span>
              </Label>
              <Input
                id="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onBlur={() => setPhoneTouched(true)}
                required
                aria-required="true"
                aria-invalid={phoneTouched && !phoneValid}
                aria-describedby={phoneTouched && !phoneValid ? "phone-error" : undefined}
                className="h-12"
              />
              {phoneTouched && !phoneValid && (
                <p id="phone-error" role="alert" className="text-destructive mt-1.5 text-sm">
                  {t.phoneInvalid}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="email" className="mb-2 block">
                {t.email}{" "}
                <span aria-hidden className="text-clay">
                  *
                </span>
              </Label>
              <Input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setEmailTouched(true)}
                required
                aria-required="true"
                aria-invalid={emailTouched && !emailValid}
                aria-describedby={
                  emailTouched && !emailValid
                    ? "email-error"
                    : emailSuggestion
                      ? "email-suggestion"
                      : undefined
                }
                className="h-12"
              />
              {emailTouched && !emailValid && (
                <p id="email-error" role="alert" className="text-destructive mt-1.5 text-sm">
                  {t.emailInvalid}
                </p>
              )}
              {/* A nudge, not a block: an unusual address is still accepted as typed. */}
              {emailValid && emailSuggestion && (
                <p id="email-suggestion" className="text-muted-foreground mt-1.5 text-sm">
                  {t.emailDidYouMean}{" "}
                  <button
                    type="button"
                    onClick={() => setEmail(emailSuggestion)}
                    className="text-clay font-medium underline underline-offset-2"
                  >
                    {emailSuggestion}
                  </button>
                  ?
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="notes" className="mb-2 block">
                {t.notes} <span className="text-muted-foreground font-normal">{t.optional}</span>
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                maxLength={1000}
              />
            </div>

            <BookingPolicy t={policy} />

            <TurnstileWidget onToken={setTurnstileToken} resetSignal={turnstileReset} />

            <Button
              type="submit"
              size="lg"
              className="h-13 w-full text-base"
              disabled={isSubmitting || !detailsComplete || (turnstileEnabled && !turnstileToken)}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> {t.booking}
                </>
              ) : (
                `${t.confirm} · ${formatPrice(totalPrice)}`
              )}
            </Button>
          </form>
        </div>
      )}

      {/* Sticky summary bar for steps 1 & 2 */}
      {step < 3 && selectedIds.length > 0 && (
        <div className="bg-background/95 md:safe-bottom fixed inset-x-0 bottom-16 z-30 border-t py-4 backdrop-blur md:bottom-0 md:pb-0">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-5 sm:px-6">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {selectedIds.length} {selectedIds.length === 1 ? t.service : t.services} ·{" "}
                {formatDuration(totalDuration)}
              </p>
              <p className="font-heading text-lg font-semibold">{formatPrice(totalPrice)}</p>
            </div>
            {step === 1 ? (
              <Button size="lg" className="h-12 shrink-0 px-6 sm:px-8" onClick={goToDateStep}>
                {t.chooseTime}
              </Button>
            ) : (
              <Button
                size="lg"
                className="h-12 shrink-0 px-6 sm:px-8"
                disabled={!selectedSlotISO}
                onClick={() => setStep(3)}
              >
                {t.continue}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
