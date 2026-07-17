import { NextResponse, type NextRequest } from "next/server";

const AD_PARAMS = ["gclid", "gad_campaignid", "gbraid", "wbraid", "fbclid"] as const;
const ADS_LANDING_PATH = "/aed/amoul-i7";
const FB_AMOUL_CAMPAIGN = "traffic_amoul_i7";

// jia1669.com is the apex domain named as the approved "สื่อ" on the PRIMEDIC ฆพ.
// licenses (ฆพ.2475/2569, ฆพ.287/2567) but the site actually runs on jiaaed.com.
// Once DNS for the apex/www is pointed at this Vercel project (see
// docs/jia1669-domain-alignment-2026-07-17.md), this sends it straight to the
// live site. Does NOT touch subaed.jia1669.com — that's a separate Vercel
// project/domain and never reaches this middleware.
const JIA1669_HOSTS = new Set(["jia1669.com", "www.jia1669.com"]);
const CANONICAL_HOST = "jiaaed.com";

export function middleware(req: NextRequest) {
  const host = req.headers.get("host")?.split(":")[0] ?? "";
  if (JIA1669_HOSTS.has(host)) {
    const url = req.nextUrl.clone();
    url.protocol = "https:";
    url.hostname = CANONICAL_HOST;
    url.port = "";
    return NextResponse.redirect(url, 301);
  }

  const { pathname, searchParams } = req.nextUrl;
  if (pathname !== "/") return NextResponse.next();

  const hasAdClickId = AD_PARAMS.some((p) => searchParams.has(p));
  const isFbAmoulCampaign =
    searchParams.get("utm_source") === "facebook" &&
    searchParams.get("utm_campaign") === FB_AMOUL_CAMPAIGN;

  if (!hasAdClickId && !isFbAmoulCampaign) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = ADS_LANDING_PATH;
  return NextResponse.redirect(url, 302);
}

export const config = {
  // Broadened from ["/"] so the jia1669.com host redirect fires on every path,
  // not just the homepage. The ad-click-id redirect below still only acts on "/".
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
