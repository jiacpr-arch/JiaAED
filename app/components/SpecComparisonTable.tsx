import {
  primedicModels,
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
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="bg-gray-900">
              <th className="sticky left-0 z-10 bg-gray-900 text-left p-4 text-gray-400 font-semibold">
                คุณสมบัติ
              </th>
              {primedicModels.map((m) => (
                <th key={m.id} className="p-4 text-center">
                  <div className="font-bold text-white">{m.name}</div>
                  {m.badge && (
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
                  <td key={m.id} className="p-4 text-center">
                    <Cell value={row.values[m.id]} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Specs shared by both PRIMEDIC models */}
      <h3 className="text-lg font-bold text-white mt-8 mb-3">สเปกร่วม (Y0 และ Y8)</h3>
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
