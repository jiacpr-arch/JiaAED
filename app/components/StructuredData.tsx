import { products } from "@/lib/aed/products";
import { primedicModels, yuwellGpsAed } from "@/lib/aed/primedic";
import { faqs } from "@/lib/aed/faqs";
import { PRIMEDIC_REGULATORY } from "@/lib/aed/regulatory";
import { LINE_OA } from "@/lib/aed/line";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://jiaaed.com";
const BRAND = "JiaAED";
const ORG_NAME = "เจี่ยรักษา (JiaAED)";

/**
 * Site-wide JSON-LD (rendered from the root layout): Organization + WebSite
 * only. Product and FAQ markup must NOT be site-wide — Google flags rich
 * results whose content doesn't appear on the page — so those live in
 * `ProductStructuredData`, rendered only on pages that actually show them.
 */
export function StructuredData() {
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: ORG_NAME,
    alternateName: "JiaAED",
    url: SITE,
    logo: `${SITE}/images/jia-logo.webp`,
    description:
      "ผู้นำเข้าและจัดจำหน่ายเครื่องกระตุกหัวใจไฟฟ้า AED Yuwell / PRIMEDIC HeartSave อย. รับรอง",
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "sales",
      availableLanguage: ["th", "en"],
      url: LINE_OA,
    },
    address: {
      "@type": "PostalAddress",
      addressCountry: "TH",
    },
    identifier: [
      // PRIMEDIC numbers are emitted only once the owner confirms them (published).
      // Amoul i7's own อย./ฆพ. identifier is no longer emitted here — it's
      // discontinued (Yuwell Y2 replaced it, ก.ค. 2026).
      ...(PRIMEDIC_REGULATORY.published && PRIMEDIC_REGULATORY.fda
        ? [
            {
              "@type": "PropertyValue",
              name: "FDA Registration (อย.) — PRIMEDIC",
              value: PRIMEDIC_REGULATORY.fda,
            },
          ]
        : []),
      // ฆพ. emitted only when a real advertising-license number exists (never null).
      ...(PRIMEDIC_REGULATORY.published && PRIMEDIC_REGULATORY.adLicense
        ? [
            {
              "@type": "PropertyValue",
              name: "Advertising License (ฆพ.) — PRIMEDIC",
              value: PRIMEDIC_REGULATORY.adLicense,
            },
          ]
        : []),
    ],
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: BRAND,
    url: SITE,
    inLanguage: "th-TH",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify([organization, website]) }}
    />
  );
}

/**
 * Product + FAQ JSON-LD — render only on pages whose visible content matches
 * (homepage shows every lineup and the FAQ section; /aed/primedic shows the
 * PRIMEDIC/Yuwell lineup).
 */
export function ProductStructuredData({
  include = "all",
}: {
  include?: "all" | "primedic";
}) {
  const productSchemas = products.map((p) => ({
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: `${p.description} ${p.features.join(" ")}`,
    image: `${SITE}/images/yuwell-y2-main.jpg`,
    brand: { "@type": "Brand", name: "Yuwell" },
    sku: p.id,
    category: "Medical Equipment / AED / Defibrillator",
    offers: {
      "@type": "Offer",
      url: `${SITE}/#brands`,
      priceCurrency: "THB",
      price: p.price,
      availability: "https://schema.org/InStock",
      seller: { "@type": "Organization", name: BRAND },
    },
  }));

  const primedicSchemas = [
    ...primedicModels.map((m) => ({
      "@context": "https://schema.org",
      "@type": "Product",
      name: m.name,
      description: `${m.summary} ${m.keyDiff} ${m.bestFor}`,
      image: `${SITE}${m.image}`,
      brand: { "@type": "Brand", name: "PRIMEDIC" },
      sku: m.id,
      category: "Medical Equipment / AED / Defibrillator",
      offers: {
        "@type": "Offer",
        url: `${SITE}/aed/primedic`,
        priceCurrency: "THB",
        price: m.price,
        availability: "https://schema.org/InStock",
        seller: { "@type": "Organization", name: BRAND },
      },
    })),
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: yuwellGpsAed.name,
      description: `${yuwellGpsAed.description} ${yuwellGpsAed.features.join(" ")}`,
      image: `${SITE}${yuwellGpsAed.image}`,
      brand: { "@type": "Brand", name: "Yuwell" },
      sku: yuwellGpsAed.id,
      category: "Medical Equipment / AED / Defibrillator",
      offers: {
        "@type": "Offer",
        url: `${SITE}/aed/primedic`,
        priceCurrency: "THB",
        price: yuwellGpsAed.price,
        availability: "https://schema.org/InStock",
        seller: { "@type": "Organization", name: BRAND },
      },
    },
  ];

  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  const blob =
    include === "primedic"
      ? primedicSchemas
      : [faqPage, ...productSchemas, ...primedicSchemas];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(blob) }}
    />
  );
}
