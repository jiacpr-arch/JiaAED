import {
  subscriptionTiers,
  subscriptionMatrix,
  type FeatureMatrixRow,
  type SubscriptionTierId,
} from "@/lib/aed/subscription";

import { LINE_OA } from "@/lib/aed/line";

function Cell({ value }: { value: FeatureMatrixRow["values"][SubscriptionTierId] }) {
  if (value === true) return <span className="text-green-400 font-bold">✓</span>;
  if (value === false) return <span className="text-gray-600">–</span>;
  return <span className="text-gray-200 text-xs">{value}</span>;
}

export function FeatureMatrix() {
  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-800">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="bg-gray-900">
            <th className="sticky left-0 z-10 bg-gray-900 text-left p-4 text-gray-400 font-semibold">
              รายการ
            </th>
            {subscriptionTiers.map((t) => (
              <th
                key={t.id}
                className={`p-4 text-center ${
                  t.badge ? "bg-yellow-400/5" : ""
                }`}
              >
                <div className="font-black text-white text-base">{t.name}</div>
                <div className="text-yellow-400 font-bold mt-1">
                  ฿{t.pricePerMonth.toLocaleString()}
                  <span className="text-gray-500 text-xs font-normal">/เดือน</span>
                </div>
                {t.badge && (
                  <div className="mt-1 inline-block bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {t.badge}
                  </div>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {subscriptionMatrix.map((row, i) => (
            <tr key={row.feature} className={i % 2 ? "bg-gray-950" : "bg-gray-900/40"}>
              <td className="sticky left-0 z-10 bg-inherit p-4 text-gray-300 font-medium">
                {row.feature}
              </td>
              {subscriptionTiers.map((t) => (
                <td
                  key={t.id}
                  className={`p-4 text-center ${t.badge ? "bg-yellow-400/[0.03]" : ""}`}
                >
                  <Cell value={row.values[t.id]} />
                </td>
              ))}
            </tr>
          ))}
          <tr className="bg-gray-900">
            <td className="sticky left-0 z-10 bg-gray-900 p-4" />
            {subscriptionTiers.map((t) => (
              <td key={t.id} className="p-4 text-center">
                <a
                  href={LINE_OA}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-line-cta="subscription_tier"
                  data-product={t.id}
                  className="inline-block bg-[#06C755] text-white text-xs font-bold px-4 py-2 rounded-full hover:bg-[#05a847]"
                >
                  เลือกแพ็กนี้
                </a>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
