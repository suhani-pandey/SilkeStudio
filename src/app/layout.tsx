import type { Metadata, Viewport } from "next";
import { EB_Garamond } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { RegisterServiceWorker } from "@/components/register-service-worker";
import { siteUrl } from "@/lib/business-info";
import { getLocale, getT } from "@/lib/i18n/server";
import "./globals.css";

// One typeface for the whole site. Garamond is a book face, so unlike Bodoni or Didot it holds up
// at form-label and price-list sizes as well as in headlines, and on a dark ground where hairline
// serifs would break up.
const garamond = EB_Garamond({
  variable: "--font-garamond",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

/**
 * Built per request rather than declared statically, so the title, description and share card
 * follow the visitor's language toggle instead of always announcing the site in English.
 */
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getT();

  return {
    metadataBase: new URL(siteUrl()),
    title: {
      default: t.meta.homeTitle,
      template: "%s · Silke Studio",
    },
    description: t.meta.homeDescription,
    keywords: [
      "beauty salon Høje Taastrup",
      "negle Høje Taastrup",
      "trådning",
      "ansigtsbehandling",
      "manicure",
      "pedicure",
      "skrædder Høje Taastrup",
      "systue Høje Taastrup",
      "oplægning af bukser",
      "clothing alterations Høje Taastrup",
      "sari blouse fitting",
    ],
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      siteName: "Silke Studio",
      locale: locale === "da" ? "da_DK" : "en_DK",
      alternateLocale: locale === "da" ? "en_DK" : "da_DK",
      url: siteUrl(),
      title: t.meta.homeShortTitle,
      description: t.meta.homeDescription,
    },
    manifest: "/manifest.webmanifest",
    appleWebApp: { capable: true, statusBarStyle: "default", title: "Silke Studio" },
    icons: {
      icon: "/images/icon-192.png",
      apple: "/images/apple-touch-icon.png",
    },
    formatDetection: { telephone: false },
  };
}

export const viewport: Viewport = {
  themeColor: "#1f3d36",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Screen readers pick pronunciation from this, and search engines use it to serve the right
  // language — so it has to follow the visitor's toggle rather than stay pinned to English.
  const locale = await getLocale();

  return (
    <html lang={locale} className={`${garamond.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {children}
        <Toaster richColors position="top-center" />
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
