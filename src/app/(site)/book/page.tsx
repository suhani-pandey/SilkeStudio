import type { Metadata } from "next";
import { BookingWizard } from "@/components/booking/booking-wizard";
import { getActiveServices } from "@/lib/actions/booking";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Book an Appointment" };

export default async function BookPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [services, profile, t] = await Promise.all([
    getActiveServices(),
    user
      ? supabase.from("profiles").select("full_name, phone, email").eq("id", user.id).single()
      : Promise.resolve({ data: null }),
    getT(),
  ]);

  const defaultContact = profile?.data
    ? {
        fullName: profile.data.full_name ?? "",
        phone: profile.data.phone ?? "",
        email: profile.data.email ?? user?.email ?? "",
      }
    : undefined;

  return (
    <div>
      <section className="bg-secondary/60 px-5 py-12 text-center sm:px-6 sm:py-16">
        <p className="eyebrow">{t.booking.eyebrow}</p>
        <h1 className="font-heading mt-3 text-3xl font-medium sm:text-5xl">{t.booking.title}</h1>
        <div className="rule-gold mx-auto mt-6" />
        <p className="text-muted-foreground mx-auto mt-6 max-w-md">
          {t.booking.body}
        </p>
      </section>
      <div className="py-10 sm:py-14">
        <BookingWizard services={services} defaultContact={defaultContact} t={t.booking} />
      </div>
    </div>
  );
}
