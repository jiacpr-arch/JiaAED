"use client";

// Browser-side conversion events for a lead the server has ACCEPTED (the
// /api/aed/lead response was ok and not a honeypot skip). Shared by every lead
// form so the events stay identical. Never call this for a click, a form view or
// a failed submit — a LINE click or an unsent form is not a lead.
//
//   lead_form_submit  — site analytics (Vercel/PostHog/aed_analytics_events)
//   generate_lead     — GA4 recommended event (mark THIS one as the GA4 key event)
//   conversion        — Google Ads lead conversion
//   Lead              — Meta Pixel, deduped with the server CAPI call by eventId
//   lead_created      — OpenAI Ads pixel
// Ad/analytics tags only fire with marketing consent.
import { pixelLeadCreated } from "@/app/openai-ads";
import { trackEvent } from "./analytics-client";
import { hasMarketingConsent } from "./consent";
import { fireMetaLead } from "./fb-tracking";
import { GADS_LEAD_CONVERSION_LABEL, gadsConversionParams } from "./google-ads-tag";

export function fireLeadConversions(opts: { variant: string; productId?: string; leadId?: string; eventId: string }) {
  pixelLeadCreated(opts.leadId);
  trackEvent("lead_form_submit", { variant: opts.variant, product_id: opts.productId ?? "none" });

  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
  if (hasMarketingConsent() && typeof gtag === "function") {
    gtag("event", "lead_form_submit", { variant: opts.variant });
    gtag("event", "generate_lead", { lead_source: opts.variant, currency: "THB" });
    const conv = gadsConversionParams(GADS_LEAD_CONVERSION_LABEL);
    if (conv) gtag("event", "conversion", conv);
  }

  fireMetaLead(opts.eventId);
}
