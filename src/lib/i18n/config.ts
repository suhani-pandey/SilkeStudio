export const locales = ["en", "da"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";
export const LOCALE_COOKIE = "glownest_locale";

export const localeLabels: Record<Locale, string> = {
  en: "English",
  da: "Dansk",
};

export function isLocale(value: string | undefined): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}
