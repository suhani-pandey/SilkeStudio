import type { Metadata } from "next";
import { getNailDesigns } from "@/lib/actions/booking";
import { getLocale, getT } from "@/lib/i18n/server";
import { DesignGallery } from "@/components/designs/design-gallery";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.meta.designsTitle, description: t.meta.designsDescription };
}

export default async function DesignsPage() {
  const [designs, t, locale] = await Promise.all([getNailDesigns(), getT(), getLocale()]);

  return (
    <div>
      <section className="bg-secondary/60 px-5 py-14 text-center sm:px-6 sm:py-20">
        <p className="eyebrow">{t.designs.eyebrow}</p>
        <h1 className="font-heading mx-auto mt-3 max-w-2xl text-4xl font-medium text-balance sm:text-6xl">
          {t.designs.title}
        </h1>
        <div className="rule-copper mx-auto mt-6" />
        <p className="text-muted-foreground mx-auto mt-6 max-w-lg">{t.designs.body}</p>
      </section>

      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-6 sm:py-16">
        {designs.length === 0 ? (
          <p className="text-muted-foreground py-16 text-center">{t.designs.empty}</p>
        ) : (
          <DesignGallery designs={designs} locale={locale} t={t.designs} />
        )}
      </div>
    </div>
  );
}
