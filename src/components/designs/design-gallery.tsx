"use client";

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { designImageUrl } from "@/lib/nail-designs";
import type { NailDesign } from "@/lib/database.types";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";

const FAVOURITES_KEY = "silke_favourite_designs";

/**
 * Favourites are a per-phone convenience, so they live in localStorage rather than behind a login.
 *
 * Read through useSyncExternalStore rather than an effect: the server has no localStorage, so this
 * gives React an explicit empty snapshot to render on the server and the real list on the client,
 * without a hydration mismatch or a second render pass.
 */
const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  // Keeps two open tabs in step.
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function readRaw(): string {
  try {
    return localStorage.getItem(FAVOURITES_KEY) ?? "[]";
  } catch {
    // A private window can refuse storage entirely.
    return "[]";
  }
}

const EMPTY = "[]";

function writeFavourites(next: string[]) {
  try {
    localStorage.setItem(FAVOURITES_KEY, JSON.stringify(next));
  } catch {
    // Nothing to do — the heart simply won't persist for this visitor.
  }
  listeners.forEach((listener) => listener());
}

export function DesignGallery({
  designs,
  locale,
  t,
}: {
  designs: NailDesign[];
  locale: Locale;
  t: Dictionary["designs"];
}) {
  const [category, setCategory] = useState<string>("all");
  const [selected, setSelected] = useState<NailDesign | null>(null);

  const raw = useSyncExternalStore(subscribe, readRaw, () => EMPTY);
  const favourites = useMemo<string[]>(() => {
    try {
      return JSON.parse(raw) as string[];
    } catch {
      return [];
    }
  }, [raw]);

  const categories = useMemo(
    () => [...new Set(designs.map((design) => design.category))],
    [designs],
  );

  const shown = useMemo(() => {
    if (category === "all") return designs;
    if (category === "favourites") return designs.filter((d) => favourites.includes(d.id));
    return designs.filter((design) => design.category === category);
  }, [designs, category, favourites]);

  const label = (design: NailDesign) => (locale === "da" && design.name_da) || design.name;
  const categoryLabel = (name: string) => {
    const match = designs.find((d) => d.category === name);
    return (locale === "da" && match?.category_da) || name;
  };

  const toggleFavourite = useCallback(
    (id: string) => {
      writeFavourites(
        favourites.includes(id) ? favourites.filter((x) => x !== id) : [...favourites, id],
      );
    },
    [favourites],
  );

  const filters = [
    { value: "all", label: t.all },
    ...categories.map((name) => ({ value: name, label: categoryLabel(name) })),
    ...(favourites.length ? [{ value: "favourites", label: t.favourites }] : []),
  ];

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <button
            key={filter.value}
            type="button"
            aria-pressed={category === filter.value}
            onClick={() => setCategory(filter.value)}
            className={cn(
              "min-h-11 rounded-full border px-4 text-sm font-medium transition-colors",
              category === filter.value
                ? "border-clay bg-clay text-primary-foreground"
                : "border-border text-muted-foreground hover:border-clay/50 hover:text-foreground",
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
        {shown.map((design) => (
          <div key={design.id} className="group relative">
            <button
              type="button"
              onClick={() => setSelected(design)}
              className="block w-full text-left"
            >
              <div className="bg-muted relative aspect-square overflow-hidden rounded-2xl">
                <Image
                  src={designImageUrl(design.image_path)}
                  alt={label(design)}
                  fill
                  sizes="(max-width: 640px) 50vw, 25vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <p className="mt-2.5 text-sm font-medium">{label(design)}</p>
              <p className="text-muted-foreground text-xs">{categoryLabel(design.category)}</p>
            </button>

            <button
              type="button"
              onClick={() => toggleFavourite(design.id)}
              aria-pressed={favourites.includes(design.id)}
              aria-label={`${favourites.includes(design.id) ? t.unfavourite : t.favourite}: ${label(design)}`}
              className="absolute top-2 right-2 flex size-11 items-center justify-center rounded-full bg-black/25 backdrop-blur-sm transition-colors hover:bg-black/40"
            >
              <Heart
                className={cn(
                  "size-5 text-white transition-colors",
                  favourites.includes(design.id) && "fill-white",
                )}
              />
            </button>
          </div>
        ))}
      </div>

      {shown.length === 0 && (
        <p className="text-muted-foreground py-16 text-center text-sm">{t.noneInCategory}</p>
      )}

      {/* The shared Dialog handles what a hand-built overlay didn't: Escape closes it, focus moves
          in and is trapped there, and it returns to the tapped design on close. */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-md gap-0 overflow-hidden p-0" showCloseButton={false}>
          {selected && (
            <>
              <div className="bg-muted relative aspect-square">
                <Image
                  src={designImageUrl(selected.image_path)}
                  alt={label(selected)}
                  fill
                  sizes="(max-width: 640px) 100vw, 448px"
                  className="object-cover"
                />
                <DialogClose
                  aria-label={t.close}
                  className="absolute top-3 right-3 flex size-11 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm"
                >
                  <X className="size-5" />
                </DialogClose>
              </div>

              <div className="p-5">
                <DialogTitle className="font-heading text-2xl font-medium">
                  {label(selected)}
                </DialogTitle>
                <p className="text-muted-foreground mt-1 text-sm">
                  {categoryLabel(selected.category)}
                </p>
                {((locale === "da" && selected.description_da) || selected.description) && (
                  <DialogDescription className="mt-3 text-sm leading-relaxed">
                    {(locale === "da" && selected.description_da) || selected.description}
                  </DialogDescription>
                )}

                {/* Carries the choice into the booking, so she knows what to prepare. */}
                <Button asChild size="lg" className="mt-6 h-12 w-full">
                  <Link
                    href={`/book?line=beauty&category=Nails&design=${encodeURIComponent(label(selected))}`}
                  >
                    {t.bookThis}
                  </Link>
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
