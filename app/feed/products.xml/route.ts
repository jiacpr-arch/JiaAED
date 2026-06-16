import { products, accessories } from "@/lib/aed/products";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://jiaaed.com";
const BRAND = "JiaAED";

function escape(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET() {
  const items = products
    .map((p) => {
      const title = `${p.name} — ${p.subtitle}`;
      const desc = `${p.description} · ${p.features.join(" · ")}`;
      return `    <item>
      <g:id>${escape(p.id)}</g:id>
      <g:title>${escape(title)}</g:title>
      <g:description>${escape(desc)}</g:description>
      <g:link>${SITE}/?utm_source=google&amp;utm_medium=cpc&amp;product=${encodeURIComponent(p.id)}#products</g:link>
      <g:image_link>${SITE}/images/product-main.png</g:image_link>
      <g:availability>in stock</g:availability>
      <g:price>${p.price.toFixed(2)} THB</g:price>
      <g:condition>new</g:condition>
      <g:brand>${escape(BRAND)}</g:brand>
      <g:identifier_exists>no</g:identifier_exists>
      <g:google_product_category>2496</g:google_product_category>
      <g:product_type>Health &amp; Beauty &gt; Health Care &gt; Medical Equipment &amp; Supplies &gt; AED</g:product_type>
    </item>`;
    })
    .join("\n");

  const accessoryItems = accessories
    .map((a) => {
      const title = `${a.name} — ${a.subtitle}`;
      const desc = `${a.description} · ${a.features.join(" · ")}`;
      return `    <item>
      <g:id>${escape(a.id)}</g:id>
      <g:title>${escape(title)}</g:title>
      <g:description>${escape(desc)}</g:description>
      <g:link>${SITE}/?utm_source=google&amp;utm_medium=cpc&amp;product=${encodeURIComponent(a.id)}#accessories</g:link>
      <g:image_link>${SITE}${a.image}</g:image_link>
      <g:availability>in stock</g:availability>
      <g:price>${a.price.toFixed(2)} THB</g:price>
      <g:condition>new</g:condition>
      <g:brand>${escape(BRAND)}</g:brand>
      <g:identifier_exists>no</g:identifier_exists>
      <g:google_product_category>2496</g:google_product_category>
      <g:product_type>Health &amp; Beauty &gt; Health Care &gt; Medical Equipment &amp; Supplies &gt; AED</g:product_type>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${escape(BRAND)} — AED Amoul i7</title>
    <link>${SITE}</link>
    <description>เครื่องกระตุกหัวใจไฟฟ้า AED Amoul i7 — อย. รับรอง</description>
${items}
${accessoryItems}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
