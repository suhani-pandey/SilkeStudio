import { defaultLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary, type Dictionary } from "@/lib/i18n/dictionaries";

/**
 * The site runs in one language. The visible switcher is gone, so this no longer reads the
 * cookie — anyone still carrying an old one would otherwise be stuck in a language they have no
 * way to change.
 *
 * The Danish copy is still written and still maintained in `dictionaries.ts`. To run the site in
 * Danish instead, change `defaultLocale` in `i18n/config.ts`; to bring the switcher back, restore
 * the cookie lookup here and drop <LanguageToggle /> back into the header.
 */
export async function getLocale(): Promise<Locale> {
  return defaultLocale;
}

/** Dictionary for the current visitor's language. */
export async function getT(): Promise<Dictionary> {
  return getDictionary(await getLocale());
}
