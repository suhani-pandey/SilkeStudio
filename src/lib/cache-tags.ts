/**
 * Cache tags for the handful of things that almost never change — the service menu, the weekly
 * opening hours, the published reviews. Every visitor to the home page, the price list and the
 * booking screen needs them, and re-querying Supabase each time added ~130 ms to every page.
 *
 * They are cached until the owner edits them, at which point the matching tag is revalidated and
 * the next request rebuilds. Nothing here is per-customer, so there is nothing to leak.
 */
export const CACHE_TAGS = {
  services: "services",
  businessHours: "business-hours",
  testimonials: "testimonials",
} as const;
