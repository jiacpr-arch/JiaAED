import type { MetadataRoute } from "next";

const SITE = "https://jiaaed.vercel.app";

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
