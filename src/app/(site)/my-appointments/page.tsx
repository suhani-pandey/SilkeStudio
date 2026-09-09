import { redirect } from "next/navigation";
import { format } from "date-fns";
import type { Metadata } from "next";
import { CalendarCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { CancelAppointmentButton } from "@/components/booking/cancel-appointment-button";
import { getUpcomingAppointmentsForCustomer } from "@/lib/actions/booking";
import { formatPrice } from "@/lib/format";
import { appointmentServiceNames } from "@/lib/database.types";
import { getLocale, getT } from "@/lib/i18n/server";
import { dateLocale } from "@/lib/date-locale";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "My Appointments" };

export default async function MyAppointmentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [appointments, t, locale] = await Promise.all([
    getUpcomingAppointmentsForCustomer(),
    getT(),
    getLocale(),
  ]);

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <div className="flex items-center justify-between">
        <div>
          <p className="eyebrow">{t.myAppointments.eyebrow}</p>
          <h1 className="font-heading mt-2 text-4xl font-medium">{t.myAppointments.title}</h1>
        </div>
        <form action={signOut}>
          <Button variant="ghost" size="sm" type="submit">
            {t.myAppointments.logOut}
          </Button>
        </form>
      </div>

      <div className="mt-10 space-y-4">
        {appointments.length === 0 && (
          <p className="text-muted-foreground py-12 text-center">{t.myAppointments.empty}</p>
        )}
        {appointments.map((appt) => (
          <Card key={appt.id} className="border-border/60">
            <CardContent className="flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <CalendarCheck className="text-primary mt-0.5 size-5 shrink-0" />
                <div>
                  <p className="font-medium">{appointmentServiceNames(appt)}</p>
                  <p className="text-muted-foreground text-sm">
                    {format(new Date(appt.start_at), t.myAppointments.dateFormat, { locale: dateLocale(locale) })}
                  </p>
                  <p className="text-muted-foreground text-sm">{formatPrice(appt.total_price)}</p>
                </div>
              </div>
              <CancelAppointmentButton
                appointmentId={appt.id}
                serviceNames={appointmentServiceNames(appt)}
                startAtISO={appt.start_at}
                t={t.myAppointments}
                locale={locale}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
