import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://omniscope.tv";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/watch/", "/scene/", "/pricing", "/blueprint"],
        disallow: ["/api/", "/dashboard", "/saved"],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
