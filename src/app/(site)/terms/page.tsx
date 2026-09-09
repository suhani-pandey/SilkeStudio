import type { Metadata } from "next";
import { businessInfo } from "@/lib/business-info";
import { getLocale } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const da = (await getLocale()) === "da";
  return {
    title: da ? "Bookingbetingelser" : "Booking terms",
    description: da
      ? "Betingelser for booking, aflysning og betaling hos GlowNest Beauty Salon."
      : "Booking, cancellation and payment terms at GlowNest Beauty Salon.",
  };
}

export default async function TermsPage() {
  const locale = await getLocale();
  const da = locale === "da";

  const sections = da
    ? [
        {
          title: "Booking",
          body: `En tid er bekræftet, når du har modtaget din bookingkode. Kontrollér venligst tidspunkt og behandlinger, og kontakt os på ${businessInfo.phone}, hvis noget ikke stemmer.`,
        },
        {
          title: "Aflysning og ændring",
          body: "Du kan aflyse selv via siden “Find din aftale” med din bookingkode og dit telefonnummer. Giv os gerne besked i god tid, så tiden kan tilbydes til en anden.",
        },
        {
          title: "Forsinkelse",
          body: "Kommer du for sent, når vi måske ikke hele behandlingen inden for den afsatte tid. Vi gør, hvad vi kan.",
        },
        {
          title: "Betaling",
          body: "Betaling sker i salonen efter behandlingen. Priserne på siden er vejledende og kan variere, hvis dit ønske kræver længere tid.",
        },
      ]
    : [
        {
          title: "Booking",
          body: `An appointment is confirmed once you have your booking code. Please check the time and services, and call ${businessInfo.phone} if anything looks wrong.`,
        },
        {
          title: "Cancelling or changing",
          body: "You can cancel yourself from the “Find your booking” page using your booking code and phone number. Please give as much notice as you can, so the time can go to someone else.",
        },
        {
          title: "Running late",
          body: "If you arrive late we may not be able to complete the full treatment within the time set aside. We'll do what we can.",
        },
        {
          title: "Payment",
          body: "Payment is taken in the salon after your treatment. Listed prices are a guide and may vary if what you want takes longer.",
        },
      ];

  return (
    <article className="mx-auto max-w-2xl px-5 py-16 sm:px-6">
      <p className="eyebrow">{da ? "Juridisk" : "Legal"}</p>
      <h1 className="font-heading mt-3 text-4xl font-medium">
        {da ? "Booking­betingelser" : "Booking terms"}
      </h1>
      <div className="rule-gold mt-6" />

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
