import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/auth/",
        "/dashboard",
        "/history",
        "/login",
        "/settings",
        "/skills",
        "/train",
        "/account-deleted",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}