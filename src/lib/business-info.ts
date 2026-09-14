// Central place for salon contact details and social links — edit here to update them everywhere.

// Opening hours and time off are stored as wall-clock times, so they need an explicit
// timezone. Hosting runs in UTC; without this every slot would shift by an hour or two.
export const SALON_TIMEZONE = "Europe/Copenhagen";

export const businessInfo = {
  name: "Silke Studio",
  address: {
    line1: "Leen B3, 2.3",
    line2: "2630 Høje Taastrup, Denmark",
  },
  phone: "91 71 90 63",
  phoneHref: "tel:+4591719063",
};

export const socialLinks = {
  instagram: "https://www.instagram.com/glownest_hoje_taastrup/",
  tiktok: "https://www.tiktok.com/@glownest357",
  // No Facebook page yet — add the URL here and it appears in the footer automatically.
  facebook: null as string | null,
};

/**
 * The salon's photos and videos of finished work all live on TikTok, so that is where anyone
 * looking for a portfolio should be sent.
 */
export const mediaLink = socialLinks.tiktok;

/** Public address of the site, used for sitemaps, share cards and SMS links. */
export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

export const mapEmbedSrc = `https://www.google.com/maps?q=${encodeURIComponent(
  `${businessInfo.address.line1}, ${businessInfo.address.line2}`,
)}&output=embed`;
