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

      {/* รู้หรือไม่ — Y0, Y8 and Y8 GPS are one machine; the pads (and GPS) differ */}
      <div className="mt-6 grid items-center gap-4 rounded-2xl border border-yellow-300 bg-yellow-50 p-5 md:grid-cols-[1.2fr_1fr]">
        <div>
          <div className="text-lg font-extrabold">💡 รู้หรือไม่?</div>
          <p className="mt-1 text-sm leading-relaxed">
            เครื่อง <b>Y0, Y8 และ Y8 GPS</b> เป็น <b className="text-red-600">เครื่องรุ่นเดียวกัน</b> — ต่างกันที่ <b>แผ่นที่ใช้</b>{" "}
            (แผ่นมาตรฐาน หรือแผ่น CPR feedback ที่วัดการกดหน้าอก) และรุ่น GPS เพิ่มระบบติดตามตำแหน่ง ส่วน <b>Yuwell Y2</b> เป็นรุ่นมีจอแสดงผล CPR และคลื่นหัวใจ
          </p>
          <p className="mt-2 text-xs text-gray-600">แผ่น CPR feedback ไม่ขายแยก — มีเป็นแผ่นเปลี่ยนให้ลูกค้าที่ใช้ Y8 / Y8 GPS อยู่แล้ว</p>
        </div>
        <div className="flex items-center justify-center gap-2 text-center text-xs font-semibold">
          <div>
            <div className="relative mx-auto h-16 w-16"><Image src="/images/primedic-pads-y8.png" alt="แผ่นอิเล็กโทรดมาตรฐาน" fill className="object-contain" sizes="64px" /></div>
            แผ่นมาตรฐาน
          </div>
          <span className="text-xl text-yellow-500">→</span>
          <div>
            <div className="relative mx-auto h-16 w-16"><Image src="/images/primedic-pads-y8.png" alt="แผ่น CPR feedback" fill className="object-contain" sizes="64px" /></div>
            + Feedback
          </div>
          <span className="text-xl font-black text-red-600">=</span>
          <div>
            <div className="relative mx-auto h-16 w-16"><Image src="/images/primedic-y-series.png" alt="เครื่อง HeartSave" fill className="object-contain" sizes="64px" /></div>
            เครื่องเดียวกัน
          </div>
        </div>
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
