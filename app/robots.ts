import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://jiaaed.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/api/aed/debug/"],
      },
      { userAgent: "GPTBot", allow: "/" },
      { userAgent: "ChatGPT-User", allow: "/" },
      { userAgent: "OAI-SearchBot", allow: "/" },
      { userAgent: "PerplexityBot", allow: "/" },
      { userAgent: "Perplexity-User", allow: "/" },
      { userAgent: "ClaudeBot", allow: "/" },
      { userAgent: "Claude-Web", allow: "/" },
      { userAgent: "Claude-User", allow: "/" },
      { userAgent: "Claude-SearchBot", allow: "/" },
      { userAgent: "Google-Extended", allow: "/" },
      { userAgent: "Applebot-Extended", allow: "/" },
      { userAgent: "Amazonbot", allow: "/" },
      { userAgent: "DuckAssistBot", allow: "/" },
      { userAgent: "meta-externalagent", allow: "/" },
      { userAgent: "cohere-ai", allow: "/" },
      { userAgent: "MistralAI-User", allow: "/" },
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
