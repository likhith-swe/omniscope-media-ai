import type { MetadataRoute } from "next";
import { CATALOG, allScenePages } from "@/lib/catalog";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://omniscope.tv";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/pricing`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/blueprint`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];

  const watchPages: MetadataRoute.Sitemap = CATALOG.map((t) => ({
    url: `${BASE}/watch/${t.slug}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.9,
  }));

  const scenePages: MetadataRoute.Sitemap = allScenePages().map((s) => ({
    url: `${BASE}/scene/${s.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticPages, ...watchPages, ...scenePages];
}
