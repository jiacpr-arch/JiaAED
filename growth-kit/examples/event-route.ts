// Copy to: app/api/event/route.ts
// Receives analytics events from the browser and runs the hot-lead check.
import { NextResponse } from "next/server";
import { createStore, ingestEvent, type EventInput } from "../lib";
import { config } from "../growth.config.example"; // in your project: "@/growth.config"

export const runtime = "nodejs";

const store = createStore(config);

export async function POST(req: Request) {
  let body: Partial<EventInput>;
  try {
    body = (await req.json()) as Partial<EventInput>;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (!body.eventName) {
    return NextResponse.json({ ok: false, reason: "missing event" }, { status: 400 });
  }

  await ingestEvent(config, store, {
    eventName: body.eventName,
    sessionId: body.sessionId ?? null,
    pageUrl: body.pageUrl ?? null,
    properties: body.properties ?? {},
    utmSource: body.utmSource ?? null,
    utmCampaign: body.utmCampaign ?? null,
    gclid: body.gclid ?? null,
  });

  return NextResponse.json({ ok: true });
}
