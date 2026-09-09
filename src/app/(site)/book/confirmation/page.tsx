import { ConfirmationView } from "@/components/booking/confirmation-view";
import { getLocale, getT } from "@/lib/i18n/server";

export default async function BookingConfirmationPage() {
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  return <ConfirmationView t={t.confirmation} locale={locale} />;
}
