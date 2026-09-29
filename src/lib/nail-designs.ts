import type { NailDesign } from "@/lib/database.types";

/**
 * Public URL for a design photo. Paths are stored rather than URLs so the Supabase project can
 * move without rewriting every row.
 */
export function designImageUrl(imagePath: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ?? "";
  return `${base}/storage/v1/object/public/nail-designs/${imagePath}`;
}

/** Designs grouped by category, preserving the owner's ordering within each. */
export function groupByCategory(designs: NailDesign[]): [string, NailDesign[]][] {
  const map = new Map<string, NailDesign[]>();
  for (const design of designs) {
    map.set(design.category, [...(map.get(design.category) ?? []), design]);
  }
  return [...map.entries()];
}
