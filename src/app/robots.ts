import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/business-info";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Nothing here is useful in search, and some of it is personal.
      disallow: ["/admin", "/my-appointments", "/booking", "/reset-password", "/offline"],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
