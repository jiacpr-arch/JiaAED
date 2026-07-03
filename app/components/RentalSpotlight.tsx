import Image from "next/image";
import Link from "next/link";
import { rentalPlans } from "@/lib/aed/rental";

import { lineOaUrl } from "@/lib/aed/line";

const LINE_OA = lineOaUrl("สนใจเช่า AED");

// Homepage hero band that makes renting (เช่า AED) the headline offer — shown
// directly under the hero so a visitor sees rental before the buy/own options.
export function RentalSpotlight() {
  return (
    <section
      id="rent"
      className="py-16 px-4 bg-gradient-to-b from-yellow-950/40 via-gray-950 to-gray-950 border-y border-yellow-400/20"
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-block bg-yellow-400 text-yellow-900 text-xs font-black px-4 py-1.5 rounded-full mb-4">
            ⭐ ทางเลือกยอดนิยม — เช่า AED
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-white">
            เช่า AED พร้อมใช้ — <span className="text-yellow-400">ไม่ต้องลงทุนก้อนใหญ่</span>
          </h2>
          <p className="text-gray-400 mt-3 max-w-2xl mx-auto">
            จ่ายเบา ๆ รายเดือน/รายปี รวมส่ง ติดตั้ง อบรม และทีมดูแลครบวงจร
            ตรวจแบต-แผ่นให้ มีเครื่องสำรองถ้าเสีย — เริ่มเพียง{" "}
            <strong className="text-yellow-400">~฿1,830/เดือน</strong> (แผนรายปี)
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Rental poster — real campaign creative */}
          <a
            href={LINE_OA}
            target="_blank"
            rel="noopener noreferrer"
            data-line-cta="home_rent_poster"
            data-product="rent-flex"
            className="block rounded-2xl overflow-hidden border border-yellow-400/30 shadow-2xl shadow-yellow-400/10 hover:border-yellow-400/60 transition-colors"
          >
            <Image
              src="/images/aed-rent-all.jpg"
              alt="แพ็กเกจเช่า AED — รายวัน / รายเดือน / รายปี"
              width={1200}
              height={800}
              className="w-full h-auto"
            />
          </a>

          {/* Three rental plans at a glance */}
          <div className="space-y-4">
            {rentalPlans.map((p) => (
              <Link
                key={p.id}
                href="/aed/rental"
                className={`flex items-center justify-between gap-4 rounded-2xl border p-5 bg-gray-900 transition-colors ${
                  p.badge
                    ? "border-yellow-400/60 hover:border-yellow-400"
                    : "border-gray-800 hover:border-yellow-400/40"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{p.name}</span>
                    {p.badge && (
                      <span className="bg-yellow-400 text-yellow-900 text-[10px] font-black px-2 py-0.5 rounded-full">
                        {p.badge}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">{p.subtitle}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-2xl font-black text-yellow-400">
                    ฿{p.price.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">{p.unit}</div>
                </div>
              </Link>
            ))}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                href="/aed/rental"
                className="flex-1 bg-yellow-400 text-yellow-900 font-bold px-6 py-3.5 rounded-full hover:bg-yellow-300 transition-colors text-center"
              >
                ดูแผนเช่าทั้งหมด →
              </Link>
              <a
                href={LINE_OA}
                target="_blank"
                rel="noopener noreferrer"
                data-line-cta="home_rent_line"
                data-product="rent-flex"
                className="flex-1 bg-[#06C755] text-white font-bold px-6 py-3.5 rounded-full hover:bg-[#05a847] transition-colors text-center"
              >
                💬 สอบถาม / จองเช่า
              </a>
            </div>
            <p className="text-center text-gray-600 text-xs">
              ราคายังไม่รวม VAT · ออกใบกำกับภาษีได้ · อย. รับรอง
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
