import { NextRequest, NextResponse } from "next/server";
import { clearCookieHeader } from "@/lib/admin/auth";

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/admin/login", request.url));
  response.headers.set("Set-Cookie", clearCookieHeader());
  return response;
}
