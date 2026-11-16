// "Pay online" form for one AED — posts to /api/checkout, which redirects to
// Stripe. Plain <form> (no client JS). Renders nothing until checkout is on
// (STRIPE_SECRET_KEY set) so the button can't appear before payments work.
import { checkoutEnabled, findCheckoutItem, paymentMethodsLabel, thbExact } from "@/lib/aed/checkout";

export function BuyOnlineButton({
  productId,
  className,
  noteClassName,
  label = "ซื้อออนไลน์ · ชำระทันที",
}: {
  productId: string;
  className: string;
  noteClassName?: string;
  label?: string;
}) {
  const item = findCheckoutItem(productId);
  if (!item || !checkoutEnabled()) return null;
  return (
    // target="_top": /aed/yuwell-y2 is embedded in an iframe on jia1669.com and
    // Stripe Checkout refuses to load inside a frame — open it in the full window.
    <form action="/api/checkout" method="post" target="_top" className="contents">
      <input type="hidden" name="productId" value={item.id} />
      <button type="submit" className={className} data-cta={`buy_online_${item.id}`} data-product={item.id}>
        {label}
      </button>
      <p className={noteClassName}>
        {paymentMethodsLabel()} · รวม VAT {thbExact(item.gross)} · ออกใบกำกับภาษีได้
      </p>
    </form>
  );
}

/** Struck-through former price, e.g. <del>฿59,999</del>. */
export function WasPrice({ amount, className }: { amount: number | null; className?: string }) {
  if (amount == null) return null;
  return (
    <del className={className} aria-label={`ราคาเดิม ฿${amount.toLocaleString("en-US")}`}>
      ฿{amount.toLocaleString("en-US")}
    </del>
  );
}
