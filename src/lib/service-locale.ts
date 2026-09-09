import type { Locale } from "@/lib/i18n/config";
import type { Service } from "@/lib/database.types";

/**
 * Service names live in the database, so they need their own translation rather than the UI
 * dictionary. The English columns stay canonical — categories group and pick their photo by
 * them — and the Danish columns are display-only, falling back when a translation is missing.
 */
export function serviceName(service: Service, locale: Locale): string {
  return (locale === "da" && service.name_da) || service.name;
}

export function serviceDescription(service: Service, locale: Locale): string | null {
  return (locale === "da" && service.description_da) || service.description;
}

export function categoryLabel(service: Service, locale: Locale): string {
  return (locale === "da" && service.category_da) || service.category;
}

/** Display label for a canonical category key, taken from any service in that category. */
export function categoryLabelFor(services: Service[], category: string, locale: Locale): string {
  const match = services.find((s) => s.category === category);
  return match ? categoryLabel(match, locale) : category;
}
