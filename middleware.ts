import { NextResponse, type NextRequest } from "next/server";

// Amoul i7 is suspended by อย. order, so its ads landing page is gone and no ad
// click may be routed to it any more. This used to hijack every ad click on "/"
// (any gclid/fbclid) and redirect it to /aed/amoul-i7 — that would have sent the
// new Yuwell Y2 ad traffic straight onto the suspended product.
//
// Ad clicks now stay on the page they landed on; the Y2 campaigns already point
// directly at /aed/yuwell-y2. Old /aed/amoul-i7 links still in the wild (or in a
// stale ad) are redirected home so they don't 404.
const REMOVED_ADS_LANDING_PATH = "/aed/amoul-i7";

export function middleware(req: NextRequest) {
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
