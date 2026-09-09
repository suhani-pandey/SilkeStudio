import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/business-info";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/services", "/book", "/booking", "/privacy", "/terms"];
  return routes.map((route) => ({
    url: `${siteUrl()}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : route === "/book" ? 0.9 : 0.6,
  }));
}
