import { getStripe } from "@/lib/aed/stripe";
import { openAiPurchase } from "@/lib/aed/openai-purchase";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin || !["https://jiaaed.com", "https://www.jiaaed.com"].includes(origin) ||
      new URL(origin).host !== req.headers.get("host")) return new Response(null, { status: 403 });
  const key = process.env.OPENAI_ADS_CAPI_KEY?.trim();
  if (process.env.OPENAI_ADS_CAPI_ENABLED !== "true" || !key) return new Response(null, { status: 204 });

  try {
    const body = await req.json();
    if (body?.consent !== true || typeof body.sessionId !== "string" ||
        !/^cs_live_[A-Za-z0-9]{1,200}$/.test(body.sessionId)) return new Response(null, { status: 400 });
    const stripe = getStripe();
    if (!stripe) return new Response(null, { status: 503 });
    const session = await stripe.checkout.sessions.retrieve(body.sessionId, { expand: ["payment_intent.latest_charge"] }, { timeout: 3000, maxNetworkRetries: 0 });
    if (session.metadata?.openai_delivery === "webhook_v1") return new Response(null, {status:204});
    const event = openAiPurchase(session, body.sessionId, req.headers.get("cookie"));
    if (!event) return new Response(null, { status: 204 });
    const response = await fetch("https://bzr.openai.com/v1/events?pid=8Qwm1bqunw9i9Ad4LXxZeX", {
      method: "POST",
      headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
      body: JSON.stringify({ events: [event] }),
      signal: AbortSignal.timeout(3000),
    });
    return new Response(null, { status: response.ok ? 204 : 502 });
  } catch {
    return new Response(null, { status: 502 });
  }
}
