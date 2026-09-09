import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getActiveServices, getBusinessHours, getPublishedTestimonials } from "@/lib/actions/booking";
import { formatPrice } from "@/lib/format";
import { categoryImage } from "@/lib/category-images";
import { businessInfo, mapEmbedSrc, socialLinks } from "@/lib/business-info";
import { LocalBusinessSchema } from "@/components/site/local-business-schema";
import { getLocale, getT } from "@/lib/i18n/server";
import { categoryLabelFor } from "@/lib/service-locale";
import { Quote, Star } from "lucide-react";
import type { Service } from "@/lib/database.types";

export default async function HomePage() {
  const [services, hours, testimonials, t, locale] = await Promise.all([
    getActiveServices(),
    getBusinessHours(),
    getPublishedTestimonials(),
    getT(),
    getLocale(),
  ]);

  const byCategory = services.reduce<Record<string, Service[]>>((acc, service) => {
    (acc[service.category] ??= []).push(service);
    return acc;
  }, {});

  const categories = Object.entries(byCategory).map(([name, items]) => ({
    name,
    label: categoryLabelFor(services, name, locale),
    image: categoryImage(name),
    from: Math.min(...items.map((s) => s.price)),
    count: items.length,
  }));

  return (
    <div>
      <LocalBusinessSchema hours={hours} services={services} />

      {/* ---------------- Hero ---------------- */}
      <section className="grid items-stretch lg:min-h-[86vh] lg:grid-cols-[1.05fr_1fr]">
        <div className="order-2 flex items-center px-5 py-12 sm:px-10 sm:py-16 lg:order-1 lg:py-24 lg:pl-16 xl:pl-24">
          <div className="max-w-xl">
            <p className="font-script text-plum text-3xl leading-none sm:text-4xl">{t.hero.welcome}</p>
            <h1 className="font-heading mt-3 text-[2.6rem] leading-[1.06] font-medium tracking-tight text-balance sm:text-6xl xl:text-7xl">
              {t.hero.title}
            </h1>
            <div className="rule-gold mt-6 sm:mt-8" />
            <p className="text-muted-foreground mt-6 leading-relaxed sm:mt-8 sm:text-lg">
{t.hero.body}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row">
              <Button asChild size="lg" className="h-13 w-full px-8 text-base sm:w-auto">
                <Link href="/book">
                  {t.hero.bookCta}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-13 w-full px-8 text-base sm:w-auto">
                <Link href="/services">{t.hero.priceCta}</Link>
              </Button>
            </div>
            <a
              href={businessInfo.phoneHref}
              className="text-muted-foreground hover:text-plum mt-6 inline-flex min-h-11 items-center gap-2 text-sm sm:mt-8"
            >
              <Phone className="size-4" />
              {t.hero.call} {businessInfo.phone}
            </a>
          </div>
        </div>

        <div className="relative order-1 min-h-[42vh] sm:min-h-[52vh] lg:order-2 lg:min-h-full">
          <Image
            src="/images/hero.jpg"
            alt={t.hero.imageAlt}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
      </section>

      {/* ---------------- Trust strip ---------------- */}
      <section className="bg-plum text-primary-foreground">
        <div className="mx-auto grid max-w-6xl gap-3 px-6 py-5 text-center text-sm sm:grid-cols-3 sm:gap-6">
          <p>{t.trust.one}</p>
          <p className="border-primary-foreground/20 sm:border-x">{t.trust.two}</p>
          <p>{t.trust.three}</p>
        </div>
      </section>

      {/* ---------------- Service categories ---------------- */}
      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-6 sm:py-24">
        <div className="max-w-2xl">
          <p className="eyebrow">{t.categories.eyebrow}</p>
          <h2 className="font-heading mt-3 text-4xl font-medium sm:text-5xl">
            {t.categories.title}
          </h2>
          <p className="text-muted-foreground mt-4">
            {t.categories.body}
          </p>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:mt-12 sm:gap-6 lg:grid-cols-4">
          {categories.map((category) => (
            <Link
              key={category.name}
              href={`/book?category=${encodeURIComponent(category.name)}`}
              className="group block"
            >
              <div className="relative aspect-[3/4] overflow-hidden sm:aspect-[4/5]">
                <Image
                  src={category.image}
                  alt={category.label}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
                <div className="absolute right-3 bottom-3 left-3 text-white sm:right-5 sm:bottom-5 sm:left-5">
                  <h3 className="font-heading text-xl font-medium sm:text-2xl">{category.label}</h3>
                  <p className="mt-0.5 text-xs text-white/85 sm:mt-1 sm:text-sm">
                    {category.count}{" "}
                    {category.count === 1 ? t.categories.service : t.categories.services} ·{" "}
                    {t.categories.from} {formatPrice(category.from)}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------------- Story ---------------- */}
      <section className="bg-secondary/60">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 sm:gap-14 sm:px-6 sm:py-24 lg:grid-cols-2 lg:gap-20">
          <div className="relative">
            <div className="border-gold/50 absolute -top-5 -left-5 hidden h-full w-full border sm:block" />
            <Image
              src="/images/about.jpg"
              alt={t.story.imageAlt}
              width={1400}
              height={933}
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="relative aspect-[4/3] w-full object-cover"
            />
          </div>
          <div>
            <p className="eyebrow">{t.story.eyebrow}</p>
            <h2 className="font-heading mt-3 text-4xl font-medium sm:text-5xl">
              {t.story.title}
            </h2>
            <div className="rule-gold mt-6" />
            <p className="text-muted-foreground mt-6 leading-relaxed">
              {t.story.body}
            </p>
            <dl className="mt-10 grid grid-cols-3 gap-6 border-t pt-8">
              <div>
                <dt className="font-heading text-plum text-3xl font-medium">10</dt>
                <dd className="text-muted-foreground mt-1 text-sm">{t.story.stat1}</dd>
              </div>
              <div>
                <dt className="font-heading text-plum text-3xl font-medium">1:1</dt>
                <dd className="text-muted-foreground mt-1 text-sm">{t.story.stat2}</dd>
              </div>
              <div>
                <dt className="font-heading text-plum text-3xl font-medium">60s</dt>
                <dd className="text-muted-foreground mt-1 text-sm">{t.story.stat3}</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* ---------------- Price menu ---------------- */}
      <section className="mx-auto max-w-4xl px-5 py-16 sm:px-6 sm:py-24">
        <div className="text-center">
          <p className="eyebrow">{t.priceMenu.eyebrow}</p>
          <h2 className="font-heading mt-3 text-4xl font-medium sm:text-5xl">{t.priceMenu.title}</h2>
          <div className="rule-gold mx-auto mt-6" />
        </div>

        <div className="mt-14 space-y-12">
          {Object.entries(byCategory).map(([category, items]) => (
            <div key={category}>
              <h3 className="font-heading border-gold/40 border-b pb-3 text-2xl font-medium">
                {categoryLabelFor(services, category, locale)}
              </h3>
              <ul className="mt-5 space-y-4">
                {items.map((service) => (
                  <li key={service.id} className="flex items-baseline gap-4">
                    <span className="font-medium">{service.name}</span>
                    <span className="border-border/70 min-w-6 flex-1 border-b border-dotted" />
                    <span className="text-muted-foreground hidden text-sm sm:inline">{service.duration_minutes} min</span>
                    <span className="font-heading text-lg font-semibold whitespace-nowrap">
                      {formatPrice(service.price)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 text-center">
          <Button asChild size="lg" className="h-13 px-10 text-base">
            <Link href="/book">{t.priceMenu.cta}</Link>
          </Button>
        </div>
      </section>

      {/* ---------------- Gallery ---------------- */}
      <section className="bg-secondary/60 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-5 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">{t.gallery.eyebrow}</p>
              <h2 className="font-heading mt-3 text-4xl font-medium sm:text-5xl">{t.gallery.title}</h2>
            </div>
            <a
              href={socialLinks.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="text-plum inline-flex min-h-11 items-center text-sm font-medium underline-offset-4 hover:underline"
            >
              {t.gallery.instagram}
            </a>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-3 sm:mt-12 sm:gap-4 lg:grid-cols-4">
            <Image
              src="/images/gallery-1.jpg"
              alt="Manicure detail"
              width={1000}
              height={1000}
              sizes="(max-width: 1024px) 50vw, 25vw"
              className="aspect-square w-full object-cover lg:row-span-2 lg:aspect-auto lg:h-full"
            />
            <Image
              src="/images/gallery-3.jpg"
              alt="Nail shaping"
              width={1000}
              height={1000}
              sizes="(max-width: 1024px) 50vw, 25vw"
              className="aspect-square w-full object-cover"
            />
            <Image
              src="/images/gallery-2.jpg"
              alt="Nail artistry"
              width={1000}
              height={1000}
              sizes="(max-width: 1024px) 50vw, 25vw"
              className="aspect-square w-full object-cover"
            />
            <Image
              src="/images/svc-brows.jpg"
              alt="Brow and lash tools"
              width={1000}
              height={1000}
              sizes="(max-width: 1024px) 50vw, 25vw"
              className="aspect-square w-full object-cover"
            />
            <Image
              src="/images/gallery-4.jpg"
              alt="Fresh towels"
              width={1000}
              height={1000}
              sizes="(max-width: 1024px) 50vw, 25vw"
              className="aspect-square w-full object-cover"
            />
            <Image
              src="/images/svc-body.jpg"
              alt="Smooth skin after waxing"
              width={1000}
              height={1000}
              sizes="(max-width: 1024px) 50vw, 25vw"
              className="aspect-square w-full object-cover"
            />
          </div>
        </div>
      </section>

      {testimonials.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 py-16 sm:px-6 sm:py-24">
          <div className="text-center">
            <p className="eyebrow">{t.testimonials.eyebrow}</p>
            <h2 className="font-heading mt-3 text-3xl font-medium sm:text-4xl">{t.testimonials.title}</h2>
            <div className="rule-gold mx-auto mt-6" />
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((testimonial) => (
              <figure key={testimonial.id} className="bg-card flex h-full flex-col border p-6">
                <Quote className="text-gold size-6" aria-hidden />
                {testimonial.rating && (
                  <div className="mt-3 flex gap-0.5" aria-label={`${testimonial.rating} out of 5`}>
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="fill-gold text-gold size-4" aria-hidden />
                    ))}
                  </div>
                )}
                <blockquote className="mt-4 flex-1 leading-relaxed">{testimonial.quote}</blockquote>
                <figcaption className="text-muted-foreground mt-5 text-sm font-medium">
                  {testimonial.author_name}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* ---------------- Visit ---------------- */}
      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-6 sm:py-24">
        <div className="grid gap-10 sm:gap-14 lg:grid-cols-2 lg:gap-20">
          <div>
            <p className="eyebrow">{t.visit.eyebrow}</p>
            <h2 className="font-heading mt-3 text-4xl font-medium sm:text-5xl">{t.visit.title}</h2>
            <div className="rule-gold mt-6" />

            <div className="mt-10 space-y-8">
              <div className="flex gap-4">
                <MapPin className="text-gold mt-1 size-5 shrink-0" />
                <div>
                  <p className="font-medium">{t.visit.address}</p>
                  <p className="text-muted-foreground mt-1">
                    {businessInfo.address.line1}
                    <br />
                    {businessInfo.address.line2}
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <Phone className="text-gold mt-1 size-5 shrink-0" />
                <div>
                  <p className="font-medium">{t.visit.phone}</p>
                  <a href={businessInfo.phoneHref} className="text-muted-foreground hover:text-plum mt-1 inline-flex min-h-11 items-center">
                    {businessInfo.phone}
                  </a>
                </div>
              </div>

              <div className="flex gap-4">
                <Clock className="text-gold mt-1 size-5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{t.visit.hours}</p>
                  <dl className="text-muted-foreground mt-2 space-y-1 text-sm">
                    {hours.map((hour) => (
                      <div key={hour.day_of_week} className="flex justify-between gap-6 sm:max-w-xs">
                        <dt>{t.days[hour.day_of_week]}</dt>
                        <dd>
                          {hour.is_closed || !hour.open_time || !hour.close_time
                            ? t.visit.closed
                            : `${hour.open_time.slice(0, 5)} – ${hour.close_time.slice(0, 5)}`}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="min-h-[380px]">
            <iframe
              title={t.visit.mapTitle}
              src={mapEmbedSrc}
              className="size-full min-h-[380px]"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* ---------------- Closing CTA ---------------- */}
      <section className="relative">
        <Image
          src="/images/svc-face.jpg"
          alt=""
          aria-hidden
          width={1200}
          height={800}
          sizes="100vw"
          className="h-80 w-full object-cover"
        />
        <div className="bg-plum/85 absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <p className="font-script text-3xl text-white/90">{t.closing.script}</p>
          <h2 className="font-heading mt-2 max-w-2xl text-4xl font-medium text-white sm:text-5xl">
            {t.closing.title}
          </h2>
          <Button asChild size="lg" variant="secondary" className="mt-8 h-13 px-10 text-base">
            <Link href="/book">
              {t.closing.cta}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
