// Central place for salon contact details and social links — edit here to update them everywhere.

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

export const mapEmbedSrc = `https://www.google.com/maps?q=${encodeURIComponent(
  `${businessInfo.address.line1}, ${businessInfo.address.line2}`,
)}&output=embed`;
