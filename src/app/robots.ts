import type { MetadataRoute } from "next";

import { absoluteSiteUrl, siteUrl } from "@/lib/site/server";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/design-system"],
    },
    sitemap: absoluteSiteUrl("/sitemap.xml"),
    host: siteUrl.origin,
  };
}
