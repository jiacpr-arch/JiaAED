import Link from "next/link";
import type { AcquisitionPackage } from "@/lib/aed/packages";

const LINE_OA = "https://line.me/R/ti/p/@273fzpzs";

const KIND_LABEL: Record<AcquisitionPackage["kind"], string> = {
  buy: "ซื้อขาด",
  "rent-to-own": "เช่าแล้วได้ซื้อ",
  "managed-rental": "เช่าบริการ",
};

export function PackageCard({ pkg }: { pkg: AcquisitionPackage }) {
  return (
    <div
      className={`relative rounded-2xl border p-6 flex flex-col bg-gray-900 ${
        pkg.badge ? "border-yellow-400/60 shadow-lg shadow-yellow-400/10" : "border-gray-800"
      }`}
    >
      {pkg.badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 text-xs font-bold px-4 py-1 rounded-full">
          {pkg.badge}
        </div>
      )}

      <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">
        {KIND_LABEL[pkg.kind]}
      </div>
      <h3 className="font-bold text-xl text-white mt-1">{pkg.name}</h3>
      <div className="text-sm text-yellow-400/90 mb-3">{pkg.nameTh}</div>
      <p className="text-sm text-gray-400 mb-4">{pkg.tagline}</p>

      <div className="mb-1 flex items-end gap-2">
        <span className="text-3xl font-black text-yellow-400">{pkg.priceLabel}</span>
        {pkg.listPriceLabel && (
          <span className="text-gray-500 line-through text-base mb-1">{pkg.listPriceLabel}</span>
        )}
      </div>
      <div className="text-gray-500 text-xs mb-4">{pkg.priceNote}</div>

      <ul className="space-y-1.5 mb-5 flex-1">
        {pkg.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
            <span className="text-yellow-400 flex-shrink-0 mt-0.5">✓</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <div className="rounded-xl bg-gray-950 border border-gray-800 px-3 py-2 text-xs text-gray-400 mb-4">
        <span className="text-gray-500">เหมาะกับ:</span> {pkg.bestFor}
      </div>

      <div className="flex flex-col gap-2">
        <a
          href={LINE_OA}
          target="_blank"
          rel="noopener noreferrer"
          data-line-cta="package_card"
          data-product={pkg.ctaProductHint}
          className={`text-center font-semibold py-3 rounded-full transition-colors ${
            pkg.badge
              ? "bg-yellow-400 text-yellow-900 hover:bg-yellow-300"
              : "bg-[#06C755] text-white hover:bg-[#05a847]"
          }`}
        >
          💬 สอบถาม / ขอใบเสนอราคา
        </a>
        {pkg.href && (
          <Link
            href={pkg.href}
            className="text-center text-sm text-yellow-400/80 hover:text-yellow-300 font-medium py-1"
          >
            ดูรายละเอียด →
          </Link>
        )}
      </div>
    </div>
  );
}
