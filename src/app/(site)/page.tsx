import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getActiveServices,
  getBusinessHours,
  getPublishedTestimonials,
} from "@/lib/actions/booking";
import { formatPrice } from "@/lib/format";
import { categoryImage } from "@/lib/category-images";
import { businessInfo, mapEmbedSrc, mapLinkUrl, socialLinks } from "@/lib/business-info";
import { MapEmbed } from "@/components/site/map-embed";
import { galleryImages } from "@/lib/gallery";
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

      {/* ---------------- Hero ----------------
          One frame that holds both trades at once: a painted manicure and a knitted cuff resting
          on folds of silk. Fabric fills most of the picture, so it still crops gracefully to any
          aspect ratio — a narrow phone or an ultrawide monitor — without losing the subject.
          The site header floats over this section (see .home-hero in globals.css). */}
      <section className="home-hero relative flex min-h-[100svh] items-center justify-center overflow-hidden">
        <Image
          src="/images/hero-studio.jpg"
          alt={t.hero.imageAlt}
          fill
          priority
          sizes="100vw"
          // Soft folds hide compression well, and this is the largest thing on the page.
          quality={68}
          className="object-cover"
        />
        {/* The photograph is pale, so the type needs a real scrim behind it rather than a hint of
            one: an overall green wash that ties it to the rest of the site, plus a deeper centre
            where the headline actually sits. */}
        <div className="from-ink/70 via-ink/55 to-background absolute inset-0 bg-gradient-to-b" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(14,32,27,0.55)_0%,rgba(14,32,27,0.15)_55%,transparent_80%)]" />

        <div className="relative mx-auto w-full max-w-3xl px-6 py-24 text-center sm:py-28">
          <p className="font-heading text-highlight text-3xl leading-none italic sm:text-4xl">
            {t.hero.welcome}
          </p>
          <h1 className="font-heading mt-5 text-[2.8rem] leading-[1.03] font-medium tracking-tight text-balance sm:text-6xl lg:text-7xl">
            {t.hero.title}
          </h1>
          <p className="text-foreground/90 mx-auto mt-7 max-w-lg leading-relaxed sm:text-lg">
            {t.hero.body}
          </p>

          <div className="mt-11 flex flex-col items-center justify-center gap-x-12 gap-y-5 sm:flex-row">
            <Link
              href="/book?line=beauty"
              className="group inline-flex min-h-11 items-center gap-2 text-sm font-semibold tracking-[0.2em] uppercase"
            >
              <span className="border-highlight/60 group-hover:border-highlight border-b-2 pb-1.5 transition-colors">
                {t.hero.bookBeautyCta}
              </span>
              <ArrowRight className="text-highlight size-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/book?line=tailoring"
              className="group inline-flex min-h-11 items-center gap-2 text-sm font-semibold tracking-[0.2em] uppercase"
            >
              <span className="border-highlight/60 group-hover:border-highlight border-b-2 pb-1.5 transition-colors">
                {t.hero.bookTailoringCta}
              </span>
              <ArrowRight className="text-highlight size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <a
            href={businessInfo.phoneHref}
            className="text-foreground/75 hover:text-foreground mt-10 inline-flex min-h-11 items-center gap-2 text-sm transition-colors"
          >
            <Phone className="size-4" />
            {t.hero.call} {businessInfo.phone}
          </a>
        </div>
      </section>

      {/* ---------------- Trust strip ---------------- */}
      <section className="surface">
        <div className="mx-auto grid max-w-6xl gap-3 px-6 py-5 text-center text-sm font-medium sm:grid-cols-3 sm:gap-6">
          <p>{t.trust.one}</p>
          <p className="sm:border-x">{t.trust.two}</p>
          <p>{t.trust.three}</p>
        </div>
      </section>

      {/* ---------------- What we do ----------------
          One section rather than two: it explains that the studio does clothes as well as faces,
          and shows every category with a price, which is what the visitor actually needs. */}
      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-6 sm:py-24">
        <div className="max-w-2xl">
          <p className="eyebrow">{t.twoTrades.eyebrow}</p>
          <h2 className="font-heading mt-3 text-4xl font-medium sm:text-5xl">
            {t.twoTrades.title}
          </h2>
          <p className="text-muted-foreground mt-4">{t.twoTrades.body}</p>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:mt-12 sm:gap-6 lg:grid-cols-4">
          {categories.map((category) => (
            <Link
              key={category.name}
              href={`/book?category=${encodeURIComponent(category.name)}`}
              className="group surface flex flex-col overflow-hidden rounded-2xl"
            >
              <div className="relative aspect-square overflow-hidden sm:aspect-[4/5]">
                <Image
                  src={category.image}
                  alt={category.label}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="flex-1 px-3 py-3 sm:px-5 sm:py-4">
                <h3 className="font-heading text-xl leading-tight font-semibold sm:text-2xl">
                  {category.label}
                </h3>
                <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
                  {category.count}{" "}
                  {category.count === 1 ? t.categories.service : t.categories.services} ·{" "}
                  {t.categories.from} {formatPrice(category.from)}
                </p>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-10 text-center sm:mt-12">
          <Button asChild size="lg" variant="outline" className="h-13 px-8 text-base">
            <Link href="/services">{t.categories.seeAll}</Link>
          </Button>
        </div>
      </section>

      {/* ---------------- Story ---------------- */}
      <section className="surface">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 sm:gap-14 sm:px-6 sm:py-24 lg:grid-cols-2 lg:gap-20">
          <div className="relative">
            <div className="border-highlight/60 absolute -top-5 -left-5 hidden h-full w-full rounded-2xl border sm:block" />
            <Image
              src="/images/about.jpg"
              alt={t.story.imageAlt}
              width={1400}
              height={933}
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="relative aspect-[4/3] w-full rounded-2xl object-cover"
            />
          </div>
          <div>
            <p className="eyebrow">{t.story.eyebrow}</p>
            <h2 className="font-heading mt-3 text-4xl font-medium sm:text-5xl">{t.story.title}</h2>
            <div className="rule-highlight mt-6" />
            <p className="text-muted-foreground mt-6 leading-relaxed">{t.story.body}</p>
            <dl className="mt-10 grid grid-cols-3 gap-6 border-t pt-8">
              {[
                { value: String(services.length), label: t.story.stat1 },
                { value: "1:1", label: t.story.stat2 },
                { value: "60s", label: t.story.stat3 },
              ].map((stat) => (
                <div key={stat.label}>
                  <dt className="text-highlight font-heading text-4xl font-semibold tracking-tight">
                    {stat.value}
                  </dt>
                  <dd className="text-muted-foreground mt-1 text-sm">{stat.label}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* ---------------- Gallery ---------------- */}
      {galleryImages.length > 0 && (
        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-5 sm:px-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow">{t.gallery.eyebrow}</p>
                <h2 className="font-heading mt-3 text-4xl font-medium sm:text-5xl">
                  {t.gallery.title}
                </h2>
              </div>
              <a
                href={socialLinks.tiktok}
                target="_blank"
                rel="noopener noreferrer"
                className="text-highlight inline-flex min-h-11 items-center text-sm font-medium underline-offset-4 hover:underline"
              >
                {t.gallery.tiktok}
              </a>
            </div>

            <p className="text-muted-foreground mt-4 max-w-xl text-sm leading-relaxed">
              {t.gallery.tiktokNote}
            </p>

            <div className="mt-10 grid grid-cols-2 gap-3 sm:mt-12 sm:gap-4 lg:gap-6">
              {galleryImages.map((image) => (
                <Image
                  key={image.src}
                  src={image.src}
                  alt={image.alt}
                  width={1000}
                  height={1000}
                  sizes="(max-width: 1024px) 50vw, 25vw"
                  className="aspect-square w-full rounded-2xl object-cover"
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {testimonials.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 py-16 sm:px-6 sm:py-24">
          <div className="text-center">
            <p className="eyebrow">{t.testimonials.eyebrow}</p>
            <h2 className="font-heading mt-3 text-3xl font-medium sm:text-4xl">
              {t.testimonials.title}
            </h2>
            <div className="rule-highlight mx-auto mt-6" />
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((testimonial) => (
              <figure key={testimonial.id} className="surface flex h-full flex-col rounded-2xl p-6">
                <Quote className="text-highlight size-6" aria-hidden />
                {testimonial.rating && (
                  <div className="mt-3 flex gap-0.5" aria-label={`${testimonial.rating} out of 5`}>
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="fill-highlight text-highlight size-4" aria-hidden />
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
            <div className="rule-highlight mt-6" />

            <div className="mt-10 space-y-8">
              <div className="flex gap-4">
                <MapPin className="text-highlight mt-1 size-5 shrink-0" />
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
                <Phone className="text-highlight mt-1 size-5 shrink-0" />
                <div>
                  <p className="font-medium">{t.visit.phone}</p>
                  <a
                    href={businessInfo.phoneHref}
                    className="text-muted-foreground hover:text-highlight mt-1 inline-flex min-h-11 items-center"
                  >
                    {businessInfo.phone}
                  </a>
                </div>
              </div>

              <div className="flex gap-4">
                <Clock className="text-highlight mt-1 size-5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{t.visit.hours}</p>
                  <dl className="text-muted-foreground mt-2 space-y-1 text-sm">
                    {hours.map((hour) => (
                      <div
                        key={hour.day_of_week}
                        className="flex justify-between gap-6 sm:max-w-xs"
                      >
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
            <MapEmbed
              src={mapEmbedSrc}
              title={t.visit.mapTitle}
              address={`${businessInfo.address.line1}, ${businessInfo.address.line2}`}
              mapsUrl={mapLinkUrl}
              t={{ show: t.visit.showMap, notice: t.visit.mapNotice, open: t.visit.openMaps }}
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
        <div className="surface bg-card/90 absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <p className="font-heading text-3xl italic">{t.closing.script}</p>
          <h2 className="font-heading mt-2 max-w-2xl text-4xl font-medium sm:text-5xl">
            {t.closing.title}
          </h2>
          <Button asChild size="lg" className="mt-8 h-13 px-10 text-base">
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
