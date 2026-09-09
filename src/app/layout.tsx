import type { Metadata, Viewport } from "next";
import { Alex_Brush, Cormorant_Garamond, Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { RegisterServiceWorker } from "@/components/register-service-worker";
import { siteUrl } from "@/lib/business-info";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const alexBrush = Alex_Brush({
  variable: "--font-script",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "GlowNest Beauty Salon — nails, threading & facials in Høje Taastrup",
    template: "%s · GlowNest Beauty Salon",
  },
  description:
    "Home-based beauty salon in Høje Taastrup. Nails, threading, facials, hair and waxing — book online in under a minute, no account needed.",
  keywords: [
    "beauty salon Høje Taastrup",
    "negle Høje Taastrup",
    "trådning",
    "ansigtsbehandling",
    "manicure",
    "pedicure",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "GlowNest Beauty Salon",
    locale: "en_DK",
    alternateLocale: "da_DK",
    url: siteUrl(),
    title: "GlowNest Beauty Salon — Høje Taastrup",
    description:
      "Nails, threading, facials, hair and waxing in a home-based salon. Book online in under a minute.",
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "GlowNest" },
  icons: {
    icon: "/images/icon-192.png",
    apple: "/images/apple-touch-icon.png",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#fbf8f3",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${cormorant.variable} ${alexBrush.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster richColors position="top-center" />
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
