import { trustStats } from "@/lib/aed/trust";

export function TrustStats() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {trustStats.map((s) => (
        <div
          key={s.label}
          className="bg-gray-900 border border-gray-800 rounded-2xl p-5 text-center"
        >
          <div className="text-3xl md:text-4xl font-black text-yellow-400">{s.value}</div>
          <div className="text-xs md:text-sm text-gray-400 mt-1">{s.label}</div>
        </div>
      ))}
    </div>
  );
}
