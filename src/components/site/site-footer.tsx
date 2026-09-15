import Link from "next/link";
import { MapPin, Phone } from "lucide-react";
import { Logo } from "@/components/site/logo";
import { FacebookIcon, InstagramIcon, TikTokIcon } from "@/components/site/social-icons";
import { businessInfo, socialLinks } from "@/lib/business-info";
import { getT } from "@/lib/i18n/server";

export async function SiteFooter() {
  const t = await getT();

  return (
    <footer className="border-t">
      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-2 sm:gap-12 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Link href="/" aria-label="Silke Studio home">
              <Logo className="h-12" />
            </Link>
            <p className="text-muted-foreground mt-5 max-w-sm text-sm leading-relaxed">
              {t.footer.tagline}
            </p>
            <div className="mt-6 flex items-center gap-4">
              <a
                href={socialLinks.tiktok}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Silke Studio on TikTok"
                className="text-muted-foreground hover:text-clay -m-2.5 p-2.5 transition-colors"
              >
                <TikTokIcon className="size-5" />
              </a>
              <a
                href={socialLinks.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Silke Studio on Instagram"
                className="text-muted-foreground hover:text-clay -m-2.5 p-2.5 transition-colors"
              >
                <InstagramIcon className="size-5" />
              </a>
              {socialLinks.facebook && (
                <a
                  href={socialLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Silke Studio on Facebook"
                  className="text-muted-foreground hover:text-clay -m-2.5 p-2.5 transition-colors"
                >
                  <FacebookIcon className="size-5" />
                </a>
              )}
            </div>
          </div>

          <div>
            <p className="eyebrow">{t.footer.explore}</p>
            <nav className="mt-4 flex flex-col gap-1 text-sm">
              <Link href="/services" className="text-muted-foreground hover:text-clay py-2.5">
                {t.footer.servicesLink}
              </Link>
              <Link href="/book" className="text-muted-foreground hover:text-clay py-2.5">
                {t.footer.bookLink}
              </Link>
              <Link
                href="/my-appointments"
                className="text-muted-foreground hover:text-clay py-2.5"
              >
                {t.footer.myAppointmentsLink}
              </Link>
              <Link href="/booking" className="text-muted-foreground hover:text-clay py-2.5">
                {t.footer.findBooking}
              </Link>
            </nav>
          </div>

          <div>
            <p className="eyebrow">{t.footer.visit}</p>
            <div className="text-muted-foreground mt-5 space-y-3 text-sm">
              <p className="flex items-start gap-2">
                <MapPin className="text-copper mt-0.5 size-4 shrink-0" />
                <span>
                  {businessInfo.address.line1}
                  <br />
                  {businessInfo.address.line2}
                </span>
              </p>
              <a
                href={businessInfo.phoneHref}
                className="hover:text-clay flex items-center gap-2 py-2.5"
              >
                <Phone className="text-copper size-4 shrink-0" />
                {businessInfo.phone}
              </a>
            </div>
          </div>
        </div>

        <div className="mt-14 border-t pt-8">
          <nav className="flex flex-wrap items-center justify-center gap-x-6 text-xs">
            <Link href="/privacy" className="text-muted-foreground hover:text-clay py-2">
              {t.footer.privacy}
            </Link>
            <Link href="/terms" className="text-muted-foreground hover:text-clay py-2">
              {t.footer.terms}
            </Link>
          </nav>
          <p className="text-muted-foreground mt-3 text-center text-xs">
            © {new Date().getFullYear()} {businessInfo.name}. {t.footer.rights}
          </p>
        </div>
      </div>
    </footer>
  );
}
