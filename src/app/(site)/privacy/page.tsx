import type { Metadata } from "next";
import { businessInfo } from "@/lib/business-info";
import { getLocale } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const da = (await getLocale()) === "da";
  return {
    title: da ? "Privatlivspolitik" : "Privacy policy",
    description: da
      ? "Sådan behandler GlowNest Beauty Salon dine personoplysninger."
      : "How GlowNest Beauty Salon handles your personal data.",
  };
}

export default async function PrivacyPage() {
  const locale = await getLocale();
  const da = locale === "da";
  const address = `${businessInfo.address.line1}, ${businessInfo.address.line2}`;

  return (
    <article className="mx-auto max-w-2xl px-5 py-16 sm:px-6">
      <p className="eyebrow">{da ? "Juridisk" : "Legal"}</p>
      <h1 className="font-heading mt-3 text-4xl font-medium">
        {da ? "Privatlivspolitik" : "Privacy policy"}
      </h1>
      <div className="rule-gold mt-6" />

      <div className="prose-sm text-muted-foreground mt-10 space-y-8 leading-relaxed">
        <section>
          <h2 className="text-foreground font-heading text-xl font-medium">
            {da ? "Hvem er dataansvarlig" : "Who is responsible"}
          </h2>
          <p className="mt-2">
            {da
              ? `${businessInfo.name}, ${address}. Kontakt os på ${businessInfo.phone}, hvis du har spørgsmål til dine oplysninger.`
              : `${businessInfo.name}, ${address}. Contact us on ${businessInfo.phone} with any question about your data.`}
          </p>
        </section>

        <section>
          <h2 className="text-foreground font-heading text-xl font-medium">
            {da ? "Hvad vi indsamler" : "What we collect"}
          </h2>
          <p className="mt-2">
            {da
              ? "Når du booker en tid, gemmer vi dit navn, dit telefonnummer, din e-mail (hvis du oplyser den), de behandlinger du har valgt, tidspunktet og eventuelle bemærkninger, du selv skriver. Opretter du en konto, gemmer vi desuden din e-mail til login."
              : "When you book, we store your name, phone number, email (if you give one), the services you chose, the time of the appointment, and any note you write yourself. If you create an account we also store your email address for signing in."}
          </p>
        </section>

        <section>
          <h2 className="text-foreground font-heading text-xl font-medium">
            {da ? "Hvorfor" : "Why"}
          </h2>
          <p className="mt-2">
            {da
              ? "Vi bruger oplysningerne til at gennemføre din booking, sende dig en bekræftelse og kontakte dig, hvis tiden skal ændres. Retsgrundlaget er opfyldelse af aftalen mellem os. Vi sælger aldrig dine oplysninger og bruger dem ikke til markedsføring uden dit samtykke."
              : "We use this to carry out your booking, send your confirmation, and contact you if the appointment needs to change. The legal basis is performance of our agreement with you. We never sell your data and never use it for marketing without your consent."}
          </p>
        </section>

        <section>
          <h2 className="text-foreground font-heading text-xl font-medium">
            {da ? "Hvem ser dem" : "Who sees it"}
          </h2>
          <p className="mt-2">
            {da
              ? "Kun salonens ejer. Vores databehandlere er Supabase (database og login) og GatewayAPI (afsendelse af SMS). De behandler kun oplysningerne på vores vegne."
              : "Only the salon owner. Our processors are Supabase (database and sign-in) and GatewayAPI (sending text messages). They process the data only on our behalf."}
          </p>
        </section>

        <section>
          <h2 className="text-foreground font-heading text-xl font-medium">
            {da ? "Hvor længe" : "How long"}
          </h2>
          <p className="mt-2">
            {da
              ? "Vi gemmer bookinger, så længe det er nødvendigt for at drive salonen og opfylde bogføringskrav. Du kan altid bede os om at slette dine oplysninger."
              : "We keep bookings for as long as we need them to run the salon and meet bookkeeping requirements. You can ask us to delete your data at any time."}
          </p>
        </section>

        <section>
          <h2 className="text-foreground font-heading text-xl font-medium">
            {da ? "Dine rettigheder" : "Your rights"}
          </h2>
          <p className="mt-2">
            {da
              ? `Du har ret til indsigt i, rettelse af og sletning af dine oplysninger, og til at gøre indsigelse mod behandlingen. Ring på ${businessInfo.phone}, så ordner vi det. Du kan klage til Datatilsynet, hvis du er utilfreds med vores håndtering.`
              : `You have the right to see, correct and delete your data, and to object to how we process it. Call ${businessInfo.phone} and we'll sort it. You may complain to the Danish Data Protection Agency (Datatilsynet) if you're unhappy with how we handle it.`}
          </p>
        </section>

        <section>
          <h2 className="text-foreground font-heading text-xl font-medium">
            {da ? "Cookies" : "Cookies"}
          </h2>
          <p className="mt-2">
            {da
              ? "Vi bruger kun nødvendige cookies: én der husker dit valgte sprog, og — hvis du opretter en konto — én der holder dig logget ind. Vi bruger ikke sporing eller reklamecookies."
              : "We use only essential cookies: one that remembers your chosen language, and — if you create an account — one that keeps you signed in. There is no tracking or advertising."}
          </p>
        </section>
      </div>
    </article>
  );
}
