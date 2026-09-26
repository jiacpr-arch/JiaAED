import { rentVsBuy } from "@/lib/aed/subscription";

export function RentVsBuyTable() {
  return (
    <>
      {/* Phones: one card per dimension — the 3-column table forced a
          sideways scroll that hid the "ซื้อขาด" column entirely. */}
      <ul className="rent-buy-cards md:hidden space-y-3">
        {rentVsBuy.map((r) => (
          <li key={r.dimension} className="rounded-2xl border border-gray-800 bg-gray-900/40 p-4">
            <p className="font-semibold text-gray-300 text-sm">{r.dimension}</p>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div className="rent-buy-cards-rent rounded-xl bg-yellow-400/[0.06] p-3">
                <dt className="text-xs font-bold text-yellow-400">เช่า AED</dt>
                <dd className="mt-1 text-gray-200">
                  <span className="text-green-400 mr-1" aria-hidden="true">✓</span>
                  {r.subscribe}
                </dd>
              </div>
              <div className="rent-buy-cards-buy rounded-xl p-3">
                <dt className="text-xs font-bold text-gray-400">ซื้อขาด</dt>
                <dd className="mt-1 text-gray-400">{r.buy}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>

      <div className="rent-buy-table hidden md:block overflow-x-auto rounded-2xl border border-gray-800">
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
    </>
  );
}
