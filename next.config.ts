import type { NextConfig } from "next";
import path from "path";

// Canonical host is the apex domain (no www) — see docs/domain-migration.md.
// www.jiaaed.com is attached to the same Vercel project, so without an
// app-level redirect it serves the whole site as a duplicate host.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://jiaaed.com";
const SITE_HOST = new URL(SITE_URL).host;

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  // Scope file tracing to this project only (prevents crawling parent dirs)
  outputFileTracingRoot: path.join(__dirname),
  async redirects() {
    // Guard: if the canonical host were ever www itself, redirecting
    // www.www.* would be nonsense — emit nothing.
    if (SITE_HOST.startsWith("www.")) return [];
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: `www.${SITE_HOST}` }],
        destination: `${SITE_URL}/:path*`,
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        // /aed/yuwell-y2 is embedded via <iframe> on www.jia1669.com — scope
        // frame-ancestors to that origin instead of the site-wide
        // clickjacking protection below.
        source: "/aed/yuwell-y2",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'self' https://jia1669.com https://www.jia1669.com",
          },
        ],
      },
      {
        // /embed/* is intentionally frameable by any site (it sets its own
        // CSP frame-ancestors *) and /aed/yuwell-y2 is scoped above, so
        // clickjacking protection applies to everything else.
        source: "/((?!embed/|aed/yuwell-y2$).*)",
        headers: [{ key: "X-Frame-Options", value: "SAMEORIGIN" }],
      },
    ];
  },
};

export default nextConfig;
