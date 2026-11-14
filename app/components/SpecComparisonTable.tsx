import Link from "next/link";
import {
  comparisonModels as primedicModels,
  modelChooser,
  Y8_ON_REQUEST_NOTE,
  Y8_STATUS,
  primedicDiffSpecs,
  primedicSharedSpecs,
  type PrimedicSpecRow,
  type PrimedicModelId,
} from "@/lib/aed/primedic";

function Cell({ value }: { value: PrimedicSpecRow["values"][PrimedicModelId] }) {
  if (value === true) return <span className="text-green-400 font-bold">✓</span>;
  if (value === false) return <span className="text-gray-600">–</span>;
  if (value === "optional") return <span className="text-yellow-400 text-xs">ตัวเลือก</span>;
  return <span className="text-gray-300 text-xs">{value}</span>;
}

export function SpecComparisonTable() {
  return (
    <div>
      {/* Per-model comparison of the specs that differ */}
      <div className="overflow-x-auto rounded-2xl border border-gray-800">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="bg-gray-900">
              <th className="sticky left-0 z-10 bg-gray-900 text-left p-4 text-gray-400 font-semibold">
                คุณสมบัติ
              </th>
              {primedicModels.map((m) => (
                <th key={m.id} className={`p-4 text-center ${m.id === "primedic-y8" ? "opacity-50" : ""}`}>
                  <div className="font-bold text-white">{m.name}</div>
                  {m.id === "primedic-y8" ? (
                    <div className="mt-1 inline-block bg-gray-800 text-gray-400 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                      {Y8_STATUS}
                    </div>
                  ) : m.badge && (
                    <div className="mt-1 inline-block bg-yellow-400/10 text-yellow-400 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-yellow-400/20">
                      {m.badge}
                    </div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {primedicDiffSpecs.map((row, i) => (
              <tr key={row.label} className={i % 2 ? "bg-gray-950" : "bg-gray-900/40"}>
                <td className="sticky left-0 z-10 bg-inherit p-4 text-gray-300 font-medium">
                  {row.label}
                </td>
                {primedicModels.map((m) => (
                  <td key={m.id} className={`p-4 text-center ${m.id === "primedic-y8" ? "opacity-50" : ""}`}>
                    <Cell value={row.values[m.id]} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-sm text-gray-400">{Y8_ON_REQUEST_NOTE}</p>

      {/* Who should buy which — so the buyer can decide, including "don't buy, rent" */}
      <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {modelChooser.map((c) => (
          <div
            key={c.id}
            className={`rounded-xl border p-4 ${c.id === "primedic-y2" ? "border-yellow-400/50 bg-yellow-400/5" : "border-gray-800 bg-gray-900"}`}
          >
            <div className="font-bold text-white">{c.title}</div>
            <ul className="mt-2 space-y-1 text-sm text-gray-300">
              {c.pick.map((t) => <li key={t}>✓ {t}</li>)}
              {c.skip.map((t) => <li key={t} className="text-gray-500">– {t}</li>)}
            </ul>
            {c.id === "yuwell-gps" && (
              <Link href="/aed/packages" className="mt-2 inline-block text-sm font-semibold text-yellow-400 hover:text-yellow-300">ดูรุ่น GPS และเช่าซื้อ →</Link>
            )}
            {c.id === "rent" && (
              <Link href="/aed/rental" className="mt-2 inline-block text-sm font-semibold text-yellow-400 hover:text-yellow-300">ดูแพ็กเกจเช่า →</Link>
            )}
          </div>
        ))}
      </div>

      {/* Specs shared by both models */}
      <h3 className="text-lg font-bold text-white mt-8 mb-3">สเปกร่วมทุกรุ่น</h3>
      <div className="grid sm:grid-cols-2 gap-2">
        {primedicSharedSpecs.map((s) => (
          <div
            key={s.label}
            className="flex justify-between gap-3 bg-gray-900 border border-gray-800 rounded-lg px-4 py-2.5 text-sm"
          >
            <span className="text-gray-500 flex-shrink-0">{s.label}</span>
            <span className="text-gray-200 text-right">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
