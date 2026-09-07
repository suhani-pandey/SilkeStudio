import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { getActiveServices } from "@/lib/actions/booking";
import { formatDuration, formatPrice } from "@/lib/format";
import { categoryImage } from "@/lib/category-images";
import { getT } from "@/lib/i18n/server";
import type { Service } from "@/lib/database.types";

export const metadata: Metadata = { title: "Services & Pricing" };

export default async function ServicesPage() {
  const [services, t] = await Promise.all([getActiveServices(), getT()]);

  const grouped = services.reduce<Record<string, Service[]>>((acc, service) => {
    (acc[service.category] ??= []).push(service);
    return acc;
  }, {});

  return (
    <div>
      <section className="bg-secondary/60 px-5 py-14 text-center sm:px-6 sm:py-20">
        <p className="eyebrow">{t.servicesPage.eyebrow}</p>
        <h1 className="font-heading mx-auto mt-3 max-w-2xl text-4xl font-medium text-balance sm:text-6xl">
          {t.servicesPage.title}
        </h1>
        <div className="rule-gold mx-auto mt-6" />
        <p className="text-muted-foreground mx-auto mt-6 max-w-lg">
          {t.servicesPage.body}
        </p>
      </section>

      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-6 sm:py-20">
        <div className="space-y-16 sm:space-y-24">
          {Object.entries(grouped).map(([category, items], index) => (
            <section key={category} className="grid items-start gap-7 sm:gap-10 lg:grid-cols-[5fr_7fr] lg:gap-16">
              <div className={index % 2 === 1 ? "lg:order-2" : undefined}>
                <Image
                  src={categoryImage(category)}
                  alt={category}
                  width={1200}
                  height={1500}
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="aspect-[4/3] w-full object-cover sm:aspect-[4/5]"
                />
              </div>

              <div className={index % 2 === 1 ? "lg:order-1" : undefined}>
                <p className="eyebrow">{String(index + 1).padStart(2, "0")}</p>
                <h2 className="font-heading mt-3 text-3xl font-medium sm:text-4xl">{category}</h2>
                <div className="rule-gold mt-5" />

                <ul className="mt-8 divide-y">
                  {items.map((service) => (
                    <li key={service.id} className="flex items-start justify-between gap-6 py-5">
                      <div>
                        <p className="font-medium">{service.name}</p>
                        {service.description && (
                          <p className="text-muted-foreground mt-1 text-sm">{service.description}</p>
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

        {services.length === 0 && (
          <p className="text-muted-foreground py-20 text-center">
            {t.servicesPage.empty}
          </p>
        )}

        <div className="border-gold/40 mt-16 border-t pt-12 text-center sm:mt-24 sm:pt-16">
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
