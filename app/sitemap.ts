import type { MetadataRoute } from "next";
import { articles } from "@/lib/aed/articles";
import { PRIMEDIC_REGULATORY } from "@/lib/aed/regulatory";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://jiaaed.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // Fragment URLs (/#foo) don't belong in a sitemap — search engines collapse
  // them all to "/" and several of the old anchors no longer exist.
  const sectionEntries: MetadataRoute.Sitemap = [
    {
      url: `${SITE}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
  ];

  const docsEntry: MetadataRoute.Sitemap = [
    {
      url: `${SITE}/aed/packages`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE}/aed/subscription`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE}/aed/rental`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SITE}/training`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${SITE}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${SITE}/quote`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
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
    {
      url: `${SITE}/news`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${SITE}/privacy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    // PRIMEDIC detail page enters the sitemap only once it's indexable (published).
    ...(PRIMEDIC_REGULATORY.published
      ? [
          {
            url: `${SITE}/aed/primedic`,
            lastModified: now,
            changeFrequency: "weekly" as const,
            priority: 0.9,
          },
        ]
      : []),
  ];

  const articleEntries: MetadataRoute.Sitemap = articles.map((a) => ({
    url: `${SITE}/articles/${a.slug}`,
    lastModified: new Date(a.publishedAt),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...sectionEntries, ...docsEntry, ...articleEntries];
}
