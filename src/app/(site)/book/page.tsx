import type { Metadata } from "next";
import { BookingWizard } from "@/components/booking/booking-wizard";
import { getActiveServices } from "@/lib/actions/booking";
import { createClient } from "@/lib/supabase/server";
import { getLocale, getT } from "@/lib/i18n/server";
import type { ServiceLine } from "@/lib/database.types";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.meta.bookTitle, description: t.meta.bookDescription };
}

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; line?: string }>;
}) {
  const { category, line } = await searchParams;
  // Arriving from "Book alterations" should open on that side of the menu, not on nails.
  const initialLine: ServiceLine | undefined =
    line === "tailoring" || line === "beauty" ? line : undefined;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [services, profile, t, locale] = await Promise.all([
    getActiveServices(),
    user
      ? supabase.from("profiles").select("full_name, phone, email").eq("id", user.id).single()
      : Promise.resolve({ data: null }),
    getT(),
    getLocale(),
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
        <div className="rule-copper mx-auto mt-6" />
        <p className="text-muted-foreground mx-auto mt-6 max-w-md">{t.booking.body}</p>
      </section>
      <div className="py-10 sm:py-14">
        <BookingWizard
          services={services}
          defaultContact={defaultContact}
          t={t.booking}
          locale={locale}
          initialCategory={category}
          initialLine={initialLine}
        />
      </div>
    </div>
  );
}
