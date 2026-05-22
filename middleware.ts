import { NextResponse, type NextRequest } from "next/server";

const AD_PARAMS = ["gclid", "gad_campaignid", "gbraid", "wbraid", "fbclid"] as const;
const ADS_LANDING_PATH = "/aed/amoul-i7";
const FB_AMOUL_CAMPAIGN = "traffic_amoul_i7";

export function middleware(req: NextRequest) {
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
  matcher: ["/"],
};
