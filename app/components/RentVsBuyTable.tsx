import { rentVsBuy } from "@/lib/aed/subscription";

export function RentVsBuyTable() {
  return (
    <div className="rent-buy-table overflow-x-auto rounded-2xl border border-gray-800">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="bg-gray-900">
            <th scope="col" className="text-left p-4 text-gray-400 font-semibold">หัวข้อ</th>
            <th scope="col" className="p-4 text-center text-white font-bold bg-yellow-400/5">
              เช่า AED (Subscription)
            </th>
            <th scope="col" className="p-4 text-center text-gray-300 font-bold">ซื้อขาดเครื่อง AED</th>
          </tr>
        </thead>
        <tbody>
          {rentVsBuy.map((r, i) => (
            <tr key={r.dimension} className={i % 2 ? "bg-gray-950" : "bg-gray-900/40"}>
              <th scope="row" className="p-4 text-left text-gray-300 font-semibold">{r.dimension}</th>
              <td className="p-4 text-center text-gray-200 bg-yellow-400/[0.03]">
                <span className="text-green-400 mr-1">✓</span>
                {r.subscribe}
              </td>
              <td className="p-4 text-center text-gray-400">{r.buy}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
