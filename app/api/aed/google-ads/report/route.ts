import { NextResponse } from "next/server";
import { isConfigured, fetchAdsReport } from "@/lib/aed/google-ads";

export const runtime = "nodejs";
export const maxDuration = 30;

function authorized(req: Request): boolean {
  const expected = process.env.AED_INTERNAL_API_KEY;
  if (!expected) return false; // never allow if no key configured
  const got = req.headers.get("authorization");
  return got === `Bearer ${expected}`;
}

// GET /api/aed/google-ads/report?days=14
// Returns real spend / conversions / CPL per campaign + top search terms.
// Bearer-protected with AED_INTERNAL_API_KEY (same as the conversion endpoint).
export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  if (!isConfigured()) {
    return NextResponse.json(
      { ok: false, error: "not_configured", message: "ยังไม่ได้ตั้งค่า GOOGLE_ADS_* env" },
      { status: 503 },
    );
  }

  const url = new URL(req.url);
  const days = Number(url.searchParams.get("days") ?? "14");
  const rangeDays = [7, 14, 30].includes(days) ? days : 14;

  try {
    const report = await fetchAdsReport(rangeDays);
    return NextResponse.json({ ok: true, ...report });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: "report_failed", message: (e as Error).message },
      { status: 502 },
    );
  }
}
