import type { Metadata } from "next";
import { businessInfo } from "@/lib/business-info";
import { getLocale } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const da = (await getLocale()) === "da";
  return {
    title: da ? "Bookingbetingelser" : "Booking terms",
    description: da
      ? "Betingelser for booking, aflysning og betaling hos Silke Studio."
      : "Booking, cancellation and payment terms at Silke Studio.",
  };
}

export default async function TermsPage() {
  const locale = await getLocale();
  const da = locale === "da";

  // Kept in step with the short version in BookingPolicy, and with the database, which is what
  // actually enforces the 24-hour cancellation rule.
  const sections = da
    ? [
        {
          title: "Booking",
          body: `En tid er bekræftet, når du har modtaget din bookingkode. Tjek tidspunkt og behandlinger. Har du problemer med at booke online, så ring på ${businessInfo.phone} — så booker vi dig ind.`,
        },
        {
          title: "Forsinkelse",
          body: `Bliver du forsinket, så ring venligst på ${businessInfo.phone} og giv besked. Kommer du meget for sent, kan vi måske ikke nå hele behandlingen i den afsatte tid, men vi gør, hvad vi kan.`,
        },
        {
          title: "Aflysning",
          body: `Aflys senest 24 timer før din tid — enten online under “Find din booking” med din bookingkode og dit telefonnummer, eller ved at ringe på ${businessInfo.phone}. Inden for de sidste 24 timer kan en tid kun aflyses på telefon.`,
        },
        {
          title: "Betaling og refusion",
          body: "Du betaler i studiet efter behandlingen. Priserne på siden er vejledende og kan variere, hvis dit ønske kræver længere tid. Behandlinger refunderes ikke, når de er udført. Det påvirker ikke dine rettigheder efter dansk forbrugerlovgivning.",
        },
        {
          title: "Feedback",
          body: `Er der noget, du ikke er tilfreds med, så sig det — i studiet eller på ${businessInfo.phone}. Vi tager imod al feedback og gør vores bedste for at rette op på det.`,
        },
      ]
    : [
        {
          title: "Booking",
          body: `An appointment is confirmed once you have your booking code. Please check the time and services. If you have any trouble booking online, call ${businessInfo.phone} and we'll book you in.`,
        },
        {
          title: "Running late",
          body: `If you're running late, please call ${businessInfo.phone} to let us know. If you arrive very late we may not be able to finish the full treatment in the time set aside, but we'll do what we can.`,
        },
        {
          title: "Cancellation",
          body: `Please cancel at least 24 hours before your appointment — online under “Find your booking” with your booking code and phone number, or by calling ${businessInfo.phone}. Within the last 24 hours, an appointment can only be cancelled by phone.`,
        },
        {
          title: "Payment and refunds",
          body: "You pay at the studio after your treatment. Prices on the site are a guide and may vary if what you'd like takes longer. Treatments aren't refunded once they've been carried out. This doesn't affect your rights under Danish consumer law.",
        },
        {
          title: "Feedback",
          body: `If anything isn't right, tell us — at the studio or on ${businessInfo.phone}. We welcome all feedback and will do our best to put it right.`,
        },
      ];

  return (
    <article className="mx-auto max-w-2xl px-5 py-16 sm:px-6">
      <p className="eyebrow">{da ? "Juridisk" : "Legal"}</p>
      <h1 className="font-heading mt-3 text-4xl font-medium">
        {da ? "Booking­betingelser" : "Booking terms"}
      </h1>
      <div className="rule-copper mt-6" />

      <div className="text-muted-foreground mt-10 space-y-8 leading-relaxed">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-foreground font-heading text-xl font-medium">{section.title}</h2>
            <p className="mt-2">{section.body}</p>
          </section>
        ))}
      </div>
    </article>
  );
}
