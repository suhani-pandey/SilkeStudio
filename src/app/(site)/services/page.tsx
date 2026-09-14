import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { getActiveServices } from "@/lib/actions/booking";
import { formatDuration, formatPrice } from "@/lib/format";
import { categoryImage } from "@/lib/category-images";
import { getLocale, getT } from "@/lib/i18n/server";
import { categoryLabelFor, serviceDescription, serviceName } from "@/lib/service-locale";
import type { Service, ServiceLine } from "@/lib/database.types";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.meta.servicesTitle, description: t.meta.servicesDescription };
}

export default async function ServicesPage() {
  const [services, t, locale] = await Promise.all([getActiveServices(), getT(), getLocale()]);

  // Beauty first, then alterations. Grouping by business line before category keeps a customer
  // looking for a hem from scrolling past six kinds of manicure.
  const lines: { line: ServiceLine; heading: string; blurb: string }[] = [
    { line: "beauty", heading: t.servicesPage.beautyHeading, blurb: t.servicesPage.beautyBlurb },
    { line: "tailoring", heading: t.servicesPage.tailoringHeading, blurb: t.servicesPage.tailoringBlurb },
  ];

  const groupedByLine = lines
    .map(({ line, heading, blurb }) => ({
      line,
      heading,
      blurb,
      categories: Object.entries(
        services
          .filter((service) => (service.service_line ?? "beauty") === line)
          .reduce<Record<string, Service[]>>((acc, service) => {
            (acc[service.category] ??= []).push(service);
            return acc;
          }, {}),
      ),
    }))
    .filter((group) => group.categories.length > 0);

  return (
    <div>
      <section className="bg-secondary/60 px-5 py-14 text-center sm:px-6 sm:py-20">
        <p className="eyebrow">{t.servicesPage.eyebrow}</p>
        <h1 className="font-heading mx-auto mt-3 max-w-2xl text-4xl font-medium text-balance sm:text-6xl">
          {t.servicesPage.title}
        </h1>
        <div className="rule-copper mx-auto mt-6" />
        <p className="text-muted-foreground mx-auto mt-6 max-w-lg">
          {t.servicesPage.body}
        </p>
      </section>

      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-6 sm:py-20">
        <div className="space-y-16 sm:space-y-24">
          {groupedByLine.map((group, groupIndex) => (
            <div key={group.line} className="space-y-16 sm:space-y-24">
              {groupedByLine.length > 1 && (
                <div id={group.line} className={groupIndex > 0 ? "scroll-mt-24 border-t pt-14 sm:pt-20" : "scroll-mt-24"}>
                  <h2 className="font-heading text-3xl font-medium sm:text-4xl">{group.heading}</h2>
                  <div className="rule-copper mt-5" />
                  <p className="text-muted-foreground mt-5 max-w-xl">{group.blurb}</p>
                </div>
              )}
              {group.categories.map(([category, items], index) => (
            <section key={category} className="grid items-start gap-7 sm:gap-10 lg:grid-cols-[5fr_7fr] lg:gap-16">
              <div className={index % 2 === 1 ? "lg:order-2" : undefined}>
                <Image
                  src={categoryImage(category)}
                  alt={category}
                  width={1200}
                  height={1500}
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="aspect-[4/3] w-full rounded-2xl object-cover sm:aspect-[4/5]"
                />
              </div>

              <div className={index % 2 === 1 ? "lg:order-1" : undefined}>
                <p className="eyebrow">{String(index + 1).padStart(2, "0")}</p>
                <h2 className="font-heading mt-3 text-3xl font-medium sm:text-4xl">
                  {categoryLabelFor(services, category, locale)}
                </h2>
                <div className="rule-copper mt-5" />

                <ul className="mt-8 divide-y">
                  {items.map((service) => (
                    <li key={service.id} className="flex items-start justify-between gap-6 py-5">
                      <div>
                        <p className="font-medium">{serviceName(service, locale)}</p>
                        {serviceDescription(service, locale) && (
                          <p className="text-muted-foreground mt-1 text-sm">
                            {serviceDescription(service, locale)}
                          </p>
                        )}
                        <p className="text-muted-foreground mt-1.5 text-xs tracking-wide uppercase">
                          {formatDuration(service.duration_minutes)}
                        </p>
                      </div>
                      <p className="font-heading text-xl font-semibold whitespace-nowrap">
                        {formatPrice(service.price)}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
              ))}
            </div>
          ))}
        </div>

        {services.length === 0 && (
          <p className="text-muted-foreground py-20 text-center">
            {t.servicesPage.empty}
          </p>
        )}

        <div className="border-copper/40 mt-16 border-t pt-12 text-center sm:mt-24 sm:pt-16">
          <h2 className="font-heading text-3xl font-medium sm:text-4xl">{t.servicesPage.readyTitle}</h2>
          <p className="text-muted-foreground mt-3">{t.servicesPage.readyBody}</p>
          <Button asChild size="lg" className="mt-8 h-13 px-10 text-base">
            <Link href="/book">{t.servicesPage.readyCta}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
