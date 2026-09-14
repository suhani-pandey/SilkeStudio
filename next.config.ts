import type { NextConfig } from "next";

/**
 * Sent on every response. The salon handles customer names, phone numbers and appointment
 * history, so the browser is told to keep the site out of frames, not to sniff content types,
 * and not to leak the page URL to third parties.
 */
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Nothing on the site uses these, so switch them off rather than leave them available.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  // Don't advertise the framework version to anyone scanning for known issues.
  poweredByHeader: false,
  images: {
    // 75 is the default; 68 is for the full-screen hero, where soft folds hide the extra
    // compression and the saving is worth far more than the detail.
    qualities: [68, 75],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
