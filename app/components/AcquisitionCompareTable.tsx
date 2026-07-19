import { acquisitionComparison } from "@/lib/aed/rental";

// 3-way comparison for /aed/rental — the two rent models this page sells get the
// highlighted columns; ซื้อขาด is the reference column.
export function AcquisitionCompareTable() {
  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-800">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="bg-gray-900">
            <th className="text-left p-4 text-gray-400 font-semibold">หัวข้อ</th>
            <th className="p-4 text-center text-white font-bold bg-yellow-400/5">เช่า</th>
            <th className="p-4 text-center text-white font-bold bg-yellow-400/5">
              เช่าซื้อ (Rent-to-Own)
            </th>
            <th className="p-4 text-center text-gray-300 font-bold">ซื้อขาด</th>
          </tr>
        </thead>
        <tbody>
          {acquisitionComparison.map((r, i) => (
            <tr key={r.dimension} className={i % 2 ? "bg-gray-950" : "bg-gray-900/40"}>
              <td className="p-4 text-gray-300 font-medium">{r.dimension}</td>
              <td className="p-4 text-center text-gray-200 bg-yellow-400/[0.03]">{r.rent}</td>
              <td className="p-4 text-center text-gray-200 bg-yellow-400/[0.03]">{r.rentToOwn}</td>
              <td className="p-4 text-center text-gray-400">{r.buy}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
