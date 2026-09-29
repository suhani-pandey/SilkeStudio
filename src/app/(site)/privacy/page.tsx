import type { Metadata } from "next";
import { businessInfo } from "@/lib/business-info";
import { getLocale } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const da = (await getLocale()) === "da";
  return {
    title: da ? "Privatlivspolitik" : "Privacy policy",
    description: da
      ? "Sådan behandler Silke Studio dine personoplysninger."
      : "How Silke Studio handles your personal data.",
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
      <div className="rule-copper mt-6" />

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
              ? "Kun studiets ejer. Vores databehandlere er Supabase (database, login og billeder), GatewayAPI (sms), Resend (e-mail) og Cloudflare Turnstile, som på bookingsiden tjekker, at du ikke er en robot — uden sporingscookies. De behandler kun oplysningerne på vores vegne. Kortet på forsiden hentes først fra Google, når du selv trykker på “Vis kort”; indtil da sendes intet til Google."
              : "Only the studio owner. Our processors are Supabase (database, sign-in and images), GatewayAPI (text messages), Resend (email) and Cloudflare Turnstile, which checks on the booking page that you're not a bot — without tracking cookies. They process the data only on our behalf. The map on the home page is loaded from Google only when you tap “Show map”; until then nothing is sent to Google."}
          </p>
        </section>

        <section>
          <h2 className="text-foreground font-heading text-xl font-medium">
            {da ? "Hvor længe" : "How long"}
          </h2>
          <p className="mt-2">
            {da
              ? "24 måneder efter din tid fjernes dit navn, telefonnummer, din e-mail og dine bemærkninger automatisk. Selve bookingen — dato, behandling og pris — beholdes af bogføringshensyn, men kan ikke længere føres tilbage til dig. Du kan altid bede os om at slette dine oplysninger tidligere."
              : "Twenty-four months after your appointment, your name, phone number, email and notes are removed automatically. The booking itself — date, service and price — is kept for bookkeeping but can no longer be traced back to you. You can ask us to delete your data sooner at any time."}
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
              ? "Vi bruger kun én nødvendig cookie: den, der holder dig logget ind, hvis du opretter en konto. De negledesign, du gemmer, ligger kun på din egen telefon og sendes aldrig til os. Vi bruger ikke sporing eller reklamecookies."
              : "We use one essential cookie: the one that keeps you signed in, if you create an account. Nail designs you save are kept only on your own phone and never sent to us. There is no tracking or advertising."}
          </p>
        </section>
      </div>
    </article>
  );
}
