import { purchaseOperation } from "@/lib/aed/purchase-receipt";

export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin || !["https://jiaaed.com","https://www.jiaaed.com"].includes(origin) ||
      new URL(origin).host !== req.headers.get("host")) return new Response(null,{status:403});
  const {receipt} = await req.json().catch(() => ({}));
  if (typeof receipt !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(receipt))
    return new Response(null,{status:400});
  await purchaseOperation("revoke", {receipt});
  return new Response(null,{status:204});
}
