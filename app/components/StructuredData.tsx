import { products } from "@/lib/aed/products";
import { primedicModels, yuwellGpsAed } from "@/lib/aed/primedic";
import { faqs } from "@/lib/aed/faqs";
import { AMOUL_REGULATORY, PRIMEDIC_REGULATORY } from "@/lib/aed/regulatory";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://jiaaed.com";
const BRAND = "JiaAED";
const ORG_NAME = "เจี่ยรักษา (JiaAED)";

export function StructuredData() {
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: ORG_NAME,
    alternateName: "JiaAED",
    url: SITE,
    logo: `${SITE}/images/product-main.png`,
    description:
      "ผู้นำเข้าและจัดจำหน่ายเครื่องกระตุกหัวใจไฟฟ้า AED Amoul i7 และ PRIMEDIC HeartSave อย. รับรอง",
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "sales",
      availableLanguage: ["th", "en"],
      url: "https://line.me/R/oaMessage/@jiacpr/?text=%E0%B8%AA%E0%B8%99%E0%B9%83%E0%B8%88+AED+%E0%B8%84%E0%B8%A3%E0%B8%B1%E0%B8%9A",
    },
    address: {
      "@type": "PostalAddress",
      addressCountry: "TH",
    },
    identifier: [
      {
        "@type": "PropertyValue",
        name: "FDA Registration (อย.) — Amoul i7",
        value: AMOUL_REGULATORY.fda,
      },
      {
        "@type": "PropertyValue",
        name: "Advertising License (ฆพ.) — Amoul i7",
        value: AMOUL_REGULATORY.adLicense,
      },
      // PRIMEDIC numbers are emitted only once the owner confirms them (published).
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

  const productSchemas = products.map((p) => ({
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: `${p.description} ${p.features.join(" ")}`,
    image: `${SITE}/images/product-main.png`,
    brand: { "@type": "Brand", name: "Amoul" },
    sku: p.id,
    category: "Medical Equipment / AED / Defibrillator",
    offers: {
      "@type": "Offer",
      url: `${SITE}/#products`,
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
        url: `${SITE}/#products`,
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
        url: `${SITE}/#products`,
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

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: BRAND,
    url: SITE,
    inLanguage: "th-TH",
  };

  const blob = [organization, website, faqPage, ...productSchemas, ...primedicSchemas];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(blob) }}
    />
  );
}
