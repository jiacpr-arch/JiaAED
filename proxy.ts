import { NextResponse, type NextRequest } from "next/server";

// Amoul i7 is suspended by อย. order. Keep old links out in the wild from
// returning a 404 while ensuring new Yuwell campaigns remain on their intended
// landing pages.
const REMOVED_ADS_LANDING_PATH = "/aed/amoul-i7";

export function proxy(req: NextRequest) {
  if (req.nextUrl.pathname === REMOVED_ADS_LANDING_PATH) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url, 301);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/aed/amoul-i7"],
};
