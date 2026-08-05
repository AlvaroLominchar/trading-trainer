import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/site-url";

const publicPaths = [
  "",
  "/legal",
  "/privacy",
  "/terms",
  "/cookies",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const lastModified = new Date();

  return publicPaths.map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified,
    changeFrequency:
      path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.4,
  }));
}
