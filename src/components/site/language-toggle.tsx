"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setLocale } from "@/lib/actions/locale";
import { locales, type Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

const SHORT_LABELS: Record<Locale, string> = { en: "EN", da: "DA" };

export function LanguageToggle({ current, className }: { current: Locale; className?: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function choose(locale: Locale) {
    if (locale === current) return;
    startTransition(async () => {
      await setLocale(locale);
      router.refresh();
    });
  }

  return (
    <div
      className={cn("border-border flex items-center rounded-full border p-0.5", className)}
      role="group"
      aria-label="Language"
    >
      {locales.map((locale) => (
        <button
          key={locale}
          type="button"
          onClick={() => choose(locale)}
          disabled={isPending}
          aria-pressed={locale === current}
          className={cn(
            "min-h-11 min-w-11 rounded-full px-3 text-xs font-semibold tracking-wide transition-colors sm:min-h-8 sm:min-w-0 sm:px-2.5 sm:py-1",
            locale === current
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {SHORT_LABELS[locale]}
        </button>
      ))}
    </div>
  );
}
