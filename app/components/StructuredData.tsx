import { products } from "@/lib/aed/products";
import { faqs } from "@/lib/aed/faqs";

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
      "ผู้นำเข้าและจัดจำหน่ายเครื่องกระตุกหัวใจไฟฟ้า AED Amoul i7 อย. รับรอง",
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "sales",
      availableLanguage: ["th", "en"],
      url: "https://line.me/R/ti/p/@273fzpzs",
    },
    address: {
      "@type": "PostalAddress",
      addressCountry: "TH",
    },
    identifier: [
      {
        "@type": "PropertyValue",
        name: "FDA Registration (อย.)",
        value: "68-2-2-2-0005243",
      },
      {
        "@type": "PropertyValue",
        name: "Advertising License (ฆพ.)",
        value: "743/2569",
      },
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

  const blob = [organization, website, faqPage, ...productSchemas];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(blob) }}
    />
  );
}
