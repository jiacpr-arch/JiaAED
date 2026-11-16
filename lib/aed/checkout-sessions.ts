// Stripe Checkout session builders shared by the public buy button
// (/api/checkout) and the admin tools (/api/admin/rental-billing).
import "server-only";
import type Stripe from "stripe";
import { findCheckoutItem, paymentMethods, satang, type CheckoutItem } from "./checkout";
import { getVatTaxRateId } from "./stripe";
import { firstInstalmentAnchor, quoteSummary, type RentalBillingPlan } from "./rental-billing";
import { holdQuote, holdSummary, type HoldPackage } from "./rental-holds";
import { findBundle } from "./bundles";

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.jiaaed.com").replace(/\/$/, "");
const SUCCESS_URL = `${SITE}/aed/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
/** Admin-made links: Stripe's maximum is 24 h. */
const linkExpiry = () => Math.floor(Date.now() / 1000) + 23 * 3600;

export type CustomerInfo = {
  customerName: string;
  companyName: string;
  email: string;
  phone: string;
  contractRef: string;
};

const infoMetadata = (i: CustomerInfo) => ({
  customer_name: i.customerName,
  company_name: i.companyName,
  phone: i.phone,
  contract_ref: i.contractRef,
});

/**
 * A one-off "หักเงินประกัน/ค่าเช่า" coupon for one link. `amountOff` is in THB
 * and is taken off before any Stripe tax rate (pass the pre-VAT amount when the
 * session uses tax rates).
 */
export async function createCreditCoupon(stripe: Stripe, amountOff: number, name: string): Promise<string> {
  const c = await stripe.coupons.create({
    amount_off: satang(amountOff),
    currency: "thb",
    duration: "once",
    max_redemptions: 1,
    redeem_by: linkExpiry() + 3600,
    name: name.slice(0, 40),
  });
  return c.id;
}

/** One-time purchase of `units` AEDs at the site price + 7% VAT (manual VAT line). */
export async function createOrderSession(
  stripe: Stripe,
  opts: {
    item: CheckoutItem;
    units?: number;
    couponId?: string;
    metadata?: Record<string, string>;
    email?: string;
    adminLink?: boolean;
  },
): Promise<Stripe.Checkout.Session> {
  const { item } = opts;
  const units = opts.units ?? 1;
  const bundle = findBundle(item.id);
  const lineName = bundle ? `ชุด AED — ${bundle.name}` : `AED ${item.name}`;
  const lineDesc = bundle ? `ราคา ex VAT · ในชุด: ${bundle.parts.map((p) => p.label).join(" · ")}`.slice(0, 500) : "ราคา ex VAT ต่อเครื่อง";
  return stripe.checkout.sessions.create({
    mode: "payment",
    locale: "th",
    currency: "thb",
    payment_method_types: paymentMethods(),
    ...(opts.email ? { customer_email: opts.email } : {}),
    line_items: [
      {
        quantity: units,
        price_data: {
          currency: "thb",
          unit_amount: satang(item.net),
          product_data: { name: lineName, description: lineDesc },
        },
      },
      {
        quantity: units,
        price_data: { currency: "thb", unit_amount: satang(item.vat), product_data: { name: "ภาษีมูลค่าเพิ่ม 7%" } },
      },
    ],
    ...(opts.couponId ? { discounts: [{ coupon: opts.couponId }] } : {}),
    billing_address_collection: "required",
    shipping_address_collection: { allowed_countries: ["TH"] },
    phone_number_collection: { enabled: true },
    // Buyers that need a ใบกำกับภาษี enter their 13-digit tax ID + company name.
    tax_id_collection: { enabled: true },
    custom_fields: [
      { key: "tax_branch", label: { type: "custom", custom: "สาขา (สำหรับใบกำกับภาษี)" }, type: "text", optional: true },
    ],
    metadata: {
      product_id: item.id,
      units: String(units),
      net_thb: String(item.net * units),
      vat_thb: String(Math.round(item.vat * units * 100) / 100),
      ...opts.metadata,
    },
    payment_intent_data: { metadata: { product_id: item.id }, description: `JiaAED — ${item.name}${units > 1 ? ` × ${units}` : ""}` },
    ...(opts.adminLink ? { expires_at: linkExpiry() } : {}),
    success_url: SUCCESS_URL,
    cancel_url: `${SITE}${item.returnPath}?checkout=cancelled`,
  });
}

/** Monthly card billing (rent-to-own or FLEX) for a signed contract. */
export async function createRentalSession(
  stripe: Stripe,
  opts: {
    plan: RentalBillingPlan;
    units: number;
    info: CustomerInfo;
    couponId?: string;
    metadata?: Record<string, string>;
    submitMessage?: string;
  },
): Promise<Stripe.Checkout.Session> {
  const { plan, units, info } = opts;
  const vat = await getVatTaxRateId(stripe);
  const metadata: Record<string, string> = {
    kind: "rental_billing",
    plan_id: plan.id,
    units: String(units),
    months_total: plan.months == null ? "" : String(plan.months),
    ...infoMetadata(info),
    ...opts.metadata,
  };
  const subscriptionData: Stripe.Checkout.SessionCreateParams.SubscriptionData = {
    description: `${plan.label}${info.contractRef ? ` · สัญญา ${info.contractRef}` : ""}`,
    metadata,
  };
  // Rent-to-own: today = down payment only; instalments start next month.
  if (!plan.firstMonthUpfront) {
    subscriptionData.billing_cycle_anchor = firstInstalmentAnchor();
    subscriptionData.proration_behavior = "none";
  }
  return stripe.checkout.sessions.create({
    mode: "subscription",
    locale: "th",
    currency: "thb",
    payment_method_types: ["card"], // PromptPay can't be charged automatically
    ...(info.email ? { customer_email: info.email } : {}),
    billing_address_collection: "required",
    tax_id_collection: { enabled: true },
    line_items: [
      {
        quantity: units,
        price_data: {
          currency: "thb",
          unit_amount: satang(plan.upfront.amount),
          product_data: { name: `${plan.upfront.label} — ${plan.label}` },
        },
        ...(plan.upfront.vat ? { tax_rates: [vat] } : {}),
      },
      {
        quantity: units,
        price_data: {
          currency: "thb",
          unit_amount: satang(plan.monthly),
          recurring: { interval: "month" },
          product_data: {
            name: `ค่า${plan.kind === "rent-to-own" ? "เช่าซื้อ" : "เช่า"}รายเดือน — ${plan.label}`,
            description: plan.months ? `${plan.months} งวด` : "ตัดทุกเดือนจนกว่าจะแจ้งเลิกเช่า",
          },
        },
        tax_rates: [vat],
      },
    ],
    ...(opts.couponId ? { discounts: [{ coupon: opts.couponId }] } : {}),
    subscription_data: subscriptionData,
    metadata,
    custom_text: { submit: { message: (opts.submitMessage ?? quoteSummary(plan, units)).slice(0, 1200) } },
    expires_at: linkExpiry(),
    success_url: SUCCESS_URL,
  });
}

/** Event rental: authorise rent + deposit on the card now, capture on return. */
export async function createHoldSession(
  stripe: Stripe,
  opts: { pkg: HoldPackage; days: number; units: number; info: CustomerInfo; eventName: string; returnDate: string },
): Promise<Stripe.Checkout.Session> {
  const { pkg, days, units, info } = opts;
  const q = holdQuote(pkg, days, units);
  const metadata: Record<string, string> = {
    kind: "rental_hold",
    package_id: pkg.id,
    days: String(days),
    units: String(units),
    rent_thb: String(q.rentGross),
    hold_thb: String(q.hold),
    event_name: opts.eventName,
    return_date: opts.returnDate,
    ...infoMetadata(info),
  };
  return stripe.checkout.sessions.create({
    mode: "payment",
    locale: "th",
    currency: "thb",
    payment_method_types: ["card"], // only cards can be held
    ...(info.email ? { customer_email: info.email } : {}),
    billing_address_collection: "required",
    phone_number_collection: { enabled: true },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "thb",
          unit_amount: satang(q.rentGross),
          product_data: {
            name: `ค่าเช่า AED — ${pkg.label} ${days} วัน${units > 1 ? ` × ${units} เครื่อง` : ""}`,
            description: "รวม VAT · ตัดเงินเมื่อคืนเครื่อง",
          },
        },
      },
      {
        quantity: 1,
        price_data: {
          currency: "thb",
          unit_amount: satang(q.hold),
          product_data: { name: "มัดจำ (กันวงเงินไว้เท่านั้น)", description: "ไม่ตัดเงิน · ปล่อยคืนบัตรเมื่อคืนเครื่องครบสภาพ" },
        },
      },
    ],
    payment_intent_data: {
      capture_method: "manual",
      description: `JiaAED — เช่าอีเวนต์${opts.eventName ? ` ${opts.eventName}` : ""}`,
      metadata,
    },
    metadata,
    custom_text: { submit: { message: holdSummary(pkg, days, units) } },
    expires_at: linkExpiry(),
    success_url: SUCCESS_URL,
  });
}

export { findCheckoutItem };
