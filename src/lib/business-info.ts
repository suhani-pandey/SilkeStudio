// Central place for salon contact details and social links — edit here to update them everywhere.

// Opening hours and time off are stored as wall-clock times, so they need an explicit
// timezone. Hosting runs in UTC; without this every slot would shift by an hour or two.
export const SALON_TIMEZONE = "Europe/Copenhagen";

export const businessInfo = {
  name: "GlowNest Beauty Salon",
  address: {
    line1: "Leen B3, 2.3",
    line2: "2630 Høje Taastrup, Denmark",
  },
  phone: "91 71 90 63",
  phoneHref: "tel:+4591719063",
};

// Placeholder handles — swap for the real profiles whenever they're ready.
export const socialLinks = {
  instagram: "https://instagram.com/glownestbeautysalon",
  facebook: "https://facebook.com/glownestbeautysalon",
  tiktok: "https://tiktok.com/@glownestbeautysalon",
};

/** Public address of the site, used for sitemaps, share cards and SMS links. */
export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

export const mapEmbedSrc = `https://www.google.com/maps?q=${encodeURIComponent(
  `${businessInfo.address.line1}, ${businessInfo.address.line2}`,
)}&output=embed`;
