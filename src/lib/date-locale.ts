import { da, enGB } from "date-fns/locale";
import type { Locale as AppLocale } from "@/lib/i18n/config";

/** date-fns locale for the visitor's language, so "mandag 8. september" reads correctly. */
export function dateLocale(locale: AppLocale) {
  return locale === "da" ? da : enGB;
}
