import type { NextConfig } from "next";
import path from "path";

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
        // Same for the HeartSave Y8 GPS landing embed (lib/aed/y8-gps-landing.ts).
        source: "/aed/heartsave-y8-gps/embed",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'self' https://jia1669.com https://www.jia1669.com",
          },
        ],
      },
      {
        // /embed/* is intentionally frameable by any site (it sets its own
        // CSP frame-ancestors *) and the two jia1669.com embeds are scoped above, so
        // clickjacking protection applies to everything else.
        source: "/((?!embed/|aed/yuwell-y2$|aed/heartsave-y8-gps/embed$).*)",
        headers: [{ key: "X-Frame-Options", value: "SAMEORIGIN" }],
      },
    ];
  },
};

export default nextConfig;
