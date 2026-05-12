import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://jiaaed.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const sections = ["", "#features", "#products", "#specs", "#contact", "#faq"];
  return sections.map((s) => ({
    url: `${SITE}/${s}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: s === "" ? 1.0 : 0.7,
  }));
}
