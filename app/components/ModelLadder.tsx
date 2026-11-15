import Image from "next/image";
import Link from "next/link";
import { PRICE_ON_REQUEST, primedicModels, Y8_STATUS, yuwellGpsAed } from "@/lib/aed/primedic";

// Four-model lineup, laid out like the owner's comparison sheet (15 พ.ย. 2026):
// Y0 · Y8 (= Y0 + feedback, งดจำหน่าย) · Y8 GPS (= Y8 + tracking) · Y2 (แนะนำ).
// White cards so it reads on both the dark (/aed/primedic) and light page styles.
const thb = (n: number) => `฿${n.toLocaleString("en-US")}`;
const price = (id: string) => thb(primedicModels.find((m) => m.id === id)!.price);

type Card = {
  id: string;
  name: string;
  sub: string;
  callout?: string;
  image: string;
  imageAlt: string;
  price: string;
  yes: string[];
  no: string[];
  discontinued?: boolean;
  recommended?: boolean;
  href: string;
  cta: string;
};

const cards: Card[] = [
  {
    id: "primedic-y0",
    name: "HeartSave Y0",
    sub: "รุ่นประหยัด คุ้มค่า",
    image: "/images/primedic-y-series.png",
    imageAlt: "เครื่อง AED PRIMEDIC HeartSave Y0",
    price: price("primedic-y0"),
    yes: ["ช็อกหัวใจได้", "เสียงพูดแนะนำภาษาไทย", "ใช้กับเด็กได้"],
    no: ["ไม่มี CPR feedback", "ไม่มีระบบติดตาม (GPS)", "ไม่มีจอแสดงผล CPR"],
    href: "/quote",
    cta: "ขอใบเสนอราคา",
  },
  {
    id: "primedic-y8",
    name: "HeartSave Y8",
    sub: "รุ่นพร้อมแผ่น feedback",
    callout: "Y8 = Y0 + Feedback",
    image: "/images/primedic-y8-open.png",
    imageAlt: "เครื่อง AED PRIMEDIC HeartSave Y8 (งดจำหน่าย)",
    price: Y8_STATUS,
    yes: ["ช็อกหัวใจได้", "เสียงพูดแนะนำภาษาไทย", "มีแผ่น CPR feedback (วัดคุณภาพการกดหน้าอก)", "ใช้กับเด็กได้"],
    no: ["ไม่มีระบบติดตาม (GPS)", "ไม่มีจอแสดงผล CPR"],
    discontinued: true,
    href: "/aed/compare",
    cta: Y8_STATUS,
  },
  {
    id: "yuwell-gps",
    name: yuwellGpsAed.name,
    sub: "รุ่นติดตามตำแหน่ง (GPS)",
    callout: "Y8 GPS = Y8 + ระบบติดตาม",
    image: yuwellGpsAed.image,
    imageAlt: "เครื่อง AED HeartSave Y8 GPS พร้อมระบบติดตามตำแหน่ง",
    price: yuwellGpsAed.price === null ? PRICE_ON_REQUEST : thb(yuwellGpsAed.price),
    yes: [
      "ช็อกหัวใจได้",
      "เสียงพูดแนะนำภาษาไทย",
      "มีแผ่น CPR feedback",
      "ติดตามตำแหน่งและสถานะเครื่องออนไลน์ (พร้อมใช้งาน / แบตเตอรี่ / แผ่น)",
      "ใช้กับเด็กได้",
    ],
    no: ["ไม่มีจอแสดงผล CPR"],
    href: "/aed/packages",
    cta: "ซื้อ / เช่าซื้อ / เช่า",
  },
  {
    id: "primedic-y2",
    name: "Yuwell Y2",
    sub: "รุ่นจอแสดงผล CPR",
    callout: "⭐ แนะนำ",
    image: "/images/primedic-y2-open.jpg",
    imageAlt: "เครื่อง AED Yuwell Y2 เปิดฝา แสดงจอสีและแผ่นอิเล็กโทรด",
    price: price("primedic-y2"),
    yes: [
      "ช็อกหัวใจได้",
      "เสียงพูดแนะนำภาษาไทย",
      "มีแผ่น CPR feedback",
      "จอสีแสดงคุณภาพ CPR (ความลึก / อัตรา / การปล่อยหน้าอก)",
      "แสดงคลื่นหัวใจ (EKG)",
      "ใช้กับเด็กได้",
    ],
    no: [],
    recommended: true,
    href: "/aed/yuwell-y2",
    cta: "ดูรายละเอียด",
  },
];

const fits = [
  { name: "Y0", text: "องค์กรขนาดเล็ก งบจำกัด ทีมผ่านการอบรม CPR" },
  { name: "Y8 GPS", text: "องค์กรที่มีหลายจุดติดตั้ง ต้องการติดตามสถานะและดูแลจากระยะไกล — มีทั้งซื้อ เช่าซื้อ และเช่า" },
  { name: "Y2 ⭐", text: "โรงพยาบาล ศูนย์ฝึกอบรม หน่วยกู้ชีพ โรงเรียน ฟิตเนส — ที่ต้องการข้อมูล CPR และ EKG บนจอ" },
];

export function ModelLadder() {
  return (
    <div className="text-gray-900">
      <div className="grid gap-5 pt-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <article
            key={c.id}
            className={`relative flex flex-col rounded-2xl border-2 bg-white p-4 shadow-sm ${
              c.recommended ? "border-yellow-400 shadow-lg shadow-yellow-400/30" : "border-gray-200"
            } ${c.discontinued ? "opacity-60" : ""}`}
          >
            {c.callout && (
              <span
                className={`absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-0.5 text-xs font-extrabold ${
                  c.recommended ? "bg-yellow-400 text-yellow-950" : "bg-yellow-200 text-gray-900"
                }`}
              >
                {c.callout}
              </span>
            )}
            <div className={`relative mt-2 aspect-[4/3] w-full overflow-hidden rounded-xl bg-white ${c.discontinued ? "hidden sm:block" : ""}`}>
              <Image
                src={c.image}
                alt={c.imageAlt}
                fill
                className={`object-contain ${c.discontinued ? "grayscale" : ""}`}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              />
            </div>
            <h3 className="mt-3 text-lg font-extrabold">{c.name}</h3>
            <div className="mt-1 inline-block self-start rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-bold text-red-700">{c.sub}</div>
            <ul className="mt-3 flex-1 space-y-1.5 text-sm">
              {c.yes.map((t) => (
                <li key={t} className="flex gap-2">
                  <span className="font-bold text-green-600">✓</span>
                  <span>{t}</span>
                </li>
              ))}
              {c.no.map((t) => (
                <li key={t} className="flex gap-2 text-gray-500">
                  <span className="font-bold">✗</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
            <div className={`mt-4 text-center text-2xl font-black ${c.discontinued ? "text-gray-500" : "text-red-600"}`}>
              {c.price}
              {!c.discontinued && c.price.startsWith("฿") && <span className="ml-1 text-xs font-normal text-gray-500">ก่อน VAT</span>}
            </div>
            {!c.discontinued && (
              <Link
                href={c.href}
                className={`mt-3 rounded-full py-2 text-center text-sm font-bold ${
                  c.recommended ? "bg-yellow-400 text-yellow-950 hover:bg-yellow-300" : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                }`}
              >
                {c.cta}
              </Link>
            )}
          </article>
        ))}
      </div>

      {/* รู้หรือไม่ — owner found the first version confusing (15 พ.ย. 2026):
          spell it out as one machine + what's added, one row per model. */}
      <div className="mt-6 rounded-2xl border border-yellow-300 bg-yellow-50 p-5">
        <div className="text-lg font-extrabold">💡 รู้หรือไม่? Y0 · Y8 · Y8 GPS คือเครื่องเดียวกัน</div>
        <p className="mt-1 text-sm text-gray-700">ต่างกันแค่ “ของที่ใส่มาด้วย” · ส่วน Y2 เป็นเครื่องคนละรุ่นที่มีจอแสดงผล</p>
        <div className="mt-4 space-y-2">
          {[
            { model: "Y0", base: "เครื่อง HeartSave", parts: ["แผ่นมาตรฐาน"], note: "", best: false },
            { model: "Y8", base: "เครื่อง HeartSave", parts: ["แผ่น CPR feedback"], note: Y8_STATUS, best: false },
            { model: "Y8 GPS", base: "เครื่อง HeartSave", parts: ["แผ่น CPR feedback", "GPS ติดตาม"], note: "", best: false },
            { model: "Y2 ⭐", base: "เครื่อง Yuwell Y2 (มีจอ)", parts: ["แผ่น CPR feedback"], note: "", best: true },
          ].map((r) => (
            <div
              key={r.model}
              className={`grid grid-cols-[4.5rem_1fr] items-center gap-3 rounded-xl bg-white p-3 text-sm font-semibold ${
                r.best ? "border-2 border-yellow-400" : ""
              } ${r.note ? "opacity-60" : ""}`}
            >
              <div className="text-lg font-black leading-tight">
                {r.model}
                {r.note && <div className="text-[10px] font-semibold text-gray-500">{r.note}</div>}
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className={`rounded-lg px-2 py-1 text-white ${r.best ? "bg-gray-900" : "bg-red-600"}`}>{r.base}</span>
                {r.parts.map((part) => (
                  <span key={part} className="flex items-center gap-1.5">
                    <span className="text-gray-400">+</span>
                    <span className="rounded-lg bg-yellow-200 px-2 py-1">{part}</span>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-gray-600">แผ่น CPR feedback ไม่ขายแยก — มีเป็นแผ่นเปลี่ยนให้ลูกค้าที่ใช้ Y8 / Y8 GPS อยู่แล้ว</p>
      </div>

      {/* รุ่นไหนเหมาะกับใคร */}
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {fits.map((f) => (
          <div key={f.name} className="rounded-xl border border-gray-200 bg-white p-4 text-sm">
            <div className="font-extrabold text-red-600">{f.name} เหมาะสำหรับ</div>
            <div className="mt-1">{f.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
