import { businessInfo, siteUrl, socialLinks } from "@/lib/business-info";
import type { BusinessHour, Service } from "@/lib/database.types";

const DAY_SCHEMA = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/**
 * Tells Google this is a local salon — name, address, phone, opening hours and price list.
 * This is what earns the business panel for searches like "beauty salon Høje Taastrup".
 */
export function LocalBusinessSchema({
  hours,
  services,
}: {
  hours: BusinessHour[];
  services: Service[];
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BeautySalon",
    name: businessInfo.name,
    url: siteUrl(),
    telephone: businessInfo.phoneHref.replace("tel:", ""),
    image: `${siteUrl()}/opengraph-image`,
    priceRange: "$$",
    currenciesAccepted: "DKK",
    address: {
      "@type": "PostalAddress",
      streetAddress: businessInfo.address.line1,
      postalCode: "2630",
      addressLocality: "Høje Taastrup",
      addressCountry: "DK",
    },
    sameAs: [socialLinks.tiktok, socialLinks.instagram, socialLinks.facebook].filter(Boolean),
    openingHoursSpecification: hours
      .filter((hour) => !hour.is_closed && hour.open_time && hour.close_time)
      .map((hour) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: `https://schema.org/${DAY_SCHEMA[hour.day_of_week]}`,
        opens: hour.open_time!.slice(0, 5),
        closes: hour.close_time!.slice(0, 5),
      })),
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Services",
      itemListElement: services.map((service) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: service.name },
        price: service.price,
        priceCurrency: "DKK",
      })),
    },
  };

  return (
    <script
      type="application/ld+json"
      // Values come from our own database, not user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
