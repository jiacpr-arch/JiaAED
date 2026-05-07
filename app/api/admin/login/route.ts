import { NextRequest, NextResponse } from "next/server";
import { verifyPassword, buildCookieHeader } from "@/lib/admin/auth";

export async function POST(request: NextRequest) {
  const body = await request.formData();
  const password = String(body.get("password") ?? "");

  const ok = await verifyPassword(password);
  if (!ok) {
    return NextResponse.redirect(new URL("/admin/login?error=1", request.url));
  }

  const response = NextResponse.redirect(new URL("/admin", request.url));
  response.headers.set("Set-Cookie", buildCookieHeader());
  return response;
}
