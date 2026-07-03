import { NextResponse } from "next/server";
import { recordConversion } from "@/lib/aed/conversion";
import { timingSafeEqual } from "@/lib/aed/timing-safe";

export const runtime = "nodejs";
export const maxDuration = 30;

type Body = {
  conversionActionId?: string;
  conversionDateTime?: string;
  orderId?: string;
  valueThb?: number;
  gclid?: string;
  gbraid?: string;
  wbraid?: string;
  email?: string;
  phone?: string;
};

function authorized(req: Request): boolean {
  const expected = process.env.AED_INTERNAL_API_KEY;
  if (!expected) return false; // never allow if no key configured
  const got = req.headers.get("authorization") ?? "";
  return timingSafeEqual(got, `Bearer ${expected}`);
}

export async function POST(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const conversionActionId =
    body.conversionActionId || process.env.GOOGLE_ADS_CONVERSION_ACTION_ID;
  if (!conversionActionId) {
    return NextResponse.json(
      { ok: false, error: "missing_conversion_action_id" },
      { status: 400 },
    );
  }

  if (
    !body.gclid &&
    !body.gbraid &&
    !body.wbraid &&
    !body.email &&
    !body.phone
  ) {
    return NextResponse.json(
      { ok: false, error: "missing_attribution", message: "ต้องมี gclid/gbraid/wbraid หรือ email/phone อย่างน้อย 1 อย่าง" },
      { status: 400 },
    );
  }

  const result = await recordConversion({
    conversionActionId,
    conversionDateTime: body.conversionDateTime,
    orderId: body.orderId,
    valueThb: body.valueThb,
    gclid: body.gclid ?? null,
    gbraid: body.gbraid ?? null,
    wbraid: body.wbraid ?? null,
    email: body.email ?? null,
    phone: body.phone ?? null,
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, sent: false, error: result.error }, { status: 502 });
  }
  return NextResponse.json({
    ok: true,
    sent: result.sent,
    matchStrategy: result.matchStrategy,
    reason: result.reason,
  });
}
