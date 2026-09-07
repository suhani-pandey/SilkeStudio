import { ConfirmationView } from "@/components/booking/confirmation-view";
import { getT } from "@/lib/i18n/server";

export default async function BookingConfirmationPage() {
  const t = await getT();
  return <ConfirmationView t={t.confirmation} />;
}
