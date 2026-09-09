import type { Metadata } from "next";
import { BookingLookup } from "@/components/booking/booking-lookup";
import { getLocale, getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.meta.lookupTitle, description: t.meta.lookupDescription };
}

export default async function BookingLookupPage() {
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  return <BookingLookup t={t.lookup} locale={locale} />;
}
