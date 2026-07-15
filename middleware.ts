import { NextResponse, type NextRequest } from "next/server";

// The dedicated /aed/amoul-i7 ad landing page was removed (Thai FDA suspension of
// Amoul i7 advertising, ก.ค. 2026). Any lingering ad final-URLs or bookmarks that
// still point there are redirected to the homepage so paid clicks don't 404.
// NOTE: the Amoul i7 ad campaigns themselves must be PAUSED at the Google/Facebook
// platform level — middleware only catches traffic, it cannot stop live ads.
const LEGACY_AMOUL_PATH = "/aed/amoul-i7";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === LEGACY_AMOUL_PATH) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url, 301);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/aed/amoul-i7"],
};
