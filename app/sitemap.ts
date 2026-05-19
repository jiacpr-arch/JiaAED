import type { MetadataRoute } from "next";
import { articles } from "@/lib/aed/articles";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://jiaaed.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const sections = ["", "#features", "#products", "#specs", "#contact", "#faq"];

  const sectionEntries: MetadataRoute.Sitemap = sections.map((s) => ({
    url: `${SITE}/${s}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: s === "" ? 1.0 : 0.7,
  }));

  const docsEntry: MetadataRoute.Sitemap = [
    {
      url: `${SITE}/docs`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE}/articles`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  const articleEntries: MetadataRoute.Sitemap = articles.map((a) => ({
    url: `${SITE}/articles/${a.slug}`,
    lastModified: new Date(a.publishedAt),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...sectionEntries, ...docsEntry, ...articleEntries];
}
