import { waitUntil } from "@vercel/functions";
import { isIP } from "node:net";
import { createAdminClient } from "@/lib/supabase/admin";
import { isGaClientId } from "@/lib/aed/ga4";
import { clean, hashIp, isValidPhone } from "@/lib/aed/lead-validation";
import { countRecent, HOUR, MINUTE, overLimit } from "@/lib/aed/rate-limit";
import { sendMetaLeadEvent } from "@/lib/aed/meta-capi";
import { deliverRentalLine } from "@/lib/aed/rental-line-outbox";
import { timingSafeEqual } from "@/lib/aed/timing-safe";

export const runtime = "nodejs";
const PAGE = "https://aed.jia1669.com/rental";
const ID = /^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i;
const TRACKING_ID = /^[\w.-]{1,255}$/;
const destinations = new Set(["ga4", "google_ads", "meta_browser", "openai_pixel"]);
const leadTypes: Record<string, string> = { rent: "เช่า AED", buy: "ซื้อ AED", advice: "ขอคำปรึกษา" };
const json = (value: object, status = 200) => Response.json(value, {
  status, headers: { "cache-control": "no-store" },
});

function trackingId(value: unknown) {
  return typeof value === "string" && TRACKING_ID.test(value) ? value : null;
}

export async function POST(req: Request) {
  const secret = process.env.AED_RENTAL_BRIDGE_SECRET;
  if (!secret || !timingSafeEqual(req.headers.get("authorization") ?? "", `Bearer ${secret}`)) {
    return json({ ok: false }, 401);
  }
  let body;
  try {
    const raw = await req.text();
    if (raw.length > 4096) return json({ ok: false }, 413);
    body = JSON.parse(raw);
  } catch {
    return json({ ok: false }, 400);
  }
  if (!body || typeof body.id !== "string" || !ID.test(body.id)) return json({ ok: false }, 400);
  const id: string = body.id;
  const ip = typeof body.ip === "string" && isIP(body.ip) ? body.ip : null;
  const ipHash = hashIp(ip);
  const db = createAdminClient();
  if (body.kind === "health") {
    const project = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!project || new URL(project).hostname !== "tpoiyykbgsgnrdwzgzvn.supabase.co") {
      return json({ ok: false }, 503);
    }
    const { error } = await db.from("aed_rental_delivery_log").select("destination").limit(0);
    return json({ ok: !error }, error ? 503 : 200);
  }
  if (process.env.VERCEL_ENV !== "production") return json({ ok: false }, 403);

  if (body.kind === "receipt") {
    if (!destinations.has(body.destination) || !["queued", "tag_callback"].includes(body.status)) {
      return json({ ok: false }, 400);
    }
    const previous = body.status === "queued" ? ["pending"] : ["pending", "queued"];
    const { error } = await db.from("aed_rental_delivery_log")
      .update({ status: body.status, updated_at: new Date().toISOString() })
      .eq("event_id", id).eq("destination", body.destination).in("status", previous);
    return json({ ok: !error }, error ? 502 : 200);
  }
  if (body.kind === "click_call" || body.kind === "click_line") {
    if (ipHash && overLimit(await countRecent("aed_analytics_events", [["ip_hash", ipHash]], MINUTE), 30)) {
      return json({ ok: false }, 429);
    }
    const { error } = await db.from("aed_analytics_events").upsert({
      id, event_name: body.kind, page_url: PAGE, ip_hash: ipHash,
      properties: { variant: "y8_gps_rental", traffic: "production" },
    }, { onConflict: "id", ignoreDuplicates: true });
    return json({ ok: !error }, error ? 502 : 200);
  }
  if (body.kind !== "lead") return json({ ok: false }, 400);

  const fullName = clean(body.fullName, 120);
  const phone = clean(body.phone, 30);
  const inquiry = typeof body.inquiryType === "string" && Object.hasOwn(leadTypes, body.inquiryType)
    ? leadTypes[body.inquiryType] : null;
  const unitCount = clean(body.unitCount, 40);
  if (!fullName || !phone || !isValidPhone(phone, 8) || !inquiry || (unitCount && !/^[1-9]\d*$/.test(unitCount))) {
    return json({ ok: false }, 400);
  }
  if (ipHash && overLimit(await countRecent("aed_leads", [["ip_hash", ipHash]], HOUR), 8)) {
    return json({ ok: false }, 429);
  }

  const marketing = body.marketing === true;
  const analytics = body.analytics === true;
  const province = clean(body.province, 80);
  const fbc = marketing ? trackingId(body.fbc) : null;
  const fbp = marketing ? trackingId(body.fbp) : null;
  const utm = marketing ? {
    source: clean(body.utm?.source, 100), medium: clean(body.utm?.medium, 100),
    campaign: clean(body.utm?.campaign, 200), term: clean(body.utm?.term, 200),
    content: clean(body.utm?.content, 200),
  } : null;
  const { data: created, error } = await db.rpc("aed_save_rental_lead", {
    p_id: id, p: {
      fullName, phone, company: clean(body.company, 200), unitCount, marketing, analytics, ipHash, utm,
      message: [inquiry, "Y8 GPS 4G", province && `จังหวัด ${province}`].filter(Boolean).join(" · "),
      gclid: marketing ? trackingId(body.gclid) : null,
      fbclid: marketing ? trackingId(body.fbclid) : null, fbc, fbp,
      gaClientId: marketing && isGaClientId(body.gaClientId) ? body.gaClientId : null,
    },
  });
  if (error) {
    console.error("rental_lead_store", error.code);
    return json({ ok: false }, 502);
  }
  if (!created) return json({ ok: true, leadId: id, skipped: "duplicate" });

  waitUntil(deliverRentalLine(id).catch(() => console.error("rental_line_delivery")));
  if (marketing) {
    waitUntil((async () => {
      const result = await sendMetaLeadEvent({
        eventId: id, phone, fbp, fbc, eventSourceUrl: PAGE,
        contentName: "HeartSave Y8 GPS 4G", leadOnly: true,
      });
      const count = result.sent ? result.eventsReceived ?? null : null;
      const status = result.sent ? (count === 1 ? "accepted" : "unconfirmed")
        : result.ok ? "not_configured" : "failed";
      const { error: logError } = await db.from("aed_rental_delivery_log")
        .update({ status, detail: count, updated_at: new Date().toISOString() })
        .eq("event_id", id).eq("destination", "meta_capi");
      if (logError) console.error("rental_meta_delivery_log", logError.code);
    })().catch(() => console.error("rental_meta_delivery")));
  }
  return json({ ok: true, leadId: id, eventId: id });
}
