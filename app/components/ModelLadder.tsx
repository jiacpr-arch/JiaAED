import Image from "next/image";
import Link from "next/link";
import { primedicModels, Y8_STATUS } from "@/lib/aed/primedic";

// Visual "what each step adds" ladder: Y0 → (+ feedback pads) → Y8 (งดจำหน่าย)
// → (+ live CPR screen) → Y2. Owner, 15 พ.ย. 2026: make the difference between
// models obvious so buyers can decide. White cards so it reads on both the dark
// (/aed/primedic) and light (/aed) page styles.
const price = (id: string) => primedicModels.find((m) => m.id === id)!.price;
const thb = (n: number) => `฿${n.toLocaleString("en-US")}`;

type Step = {
  id: string;
  name: string;
  label: string;
  image: string;
  imageAlt: string;
  price: string;
  yes: string[];
  no: string[];
  discontinued?: boolean;
  recommended?: boolean;
  href: string;
};

const steps: Step[] = [
  {
    id: "primedic-y0",
    name: "HeartSave Y0",
    label: "รุ่นประหยัด",
    image: "/images/primedic-y-series.png",
    imageAlt: "เครื่อง AED PRIMEDIC HeartSave Y0",
    price: thb(price("primedic-y0")),
    yes: ["ช็อก + เสียงนำทางภาษาไทย", "ใช้กับเด็กได้"],
    no: ["แผ่นที่แถมมาเป็นแบบไม่มี CPR feedback", "ไม่มีจอแสดงผล CPR"],
    href: "/aed/primedic#primedic-specs",
  },
  {
    id: "primedic-y8",
    name: "HeartSave Y8",
    label: Y8_STATUS,
    image: "/images/primedic-y8-open.png",
    imageAlt: "เครื่อง AED PRIMEDIC HeartSave Y8 (งดจำหน่าย)",
    price: Y8_STATUS,
    yes: ["เครื่องเดียวกับ Y0", "แถมแผ่น CPR feedback — เสียงบอกแรง/จังหวะกด"],
    no: ["ไม่มีจอแสดงผล CPR"],
    discontinued: true,
    href: "/aed/primedic#primedic-specs",
  },
  {
    id: "primedic-y2",
    name: "Yuwell Y2",
    label: "⭐ แนะนำ",
    image: "/images/primedic-y2-open.jpg",
    imageAlt: "เครื่อง AED Yuwell Y2 เปิดฝา แสดงจอสีและแผ่นอิเล็กโทรด",
    price: thb(price("primedic-y2")),
    yes: [
      "ช็อก + เสียงนำทางภาษาไทย",
      "แผ่นวัดการกดหน้าอก",
      "จอโชว์ความเร็ว / ความลึก / การปล่อยหน้าอก สด ๆ",
      "จอสีแสดงคลื่นหัวใจ (EKG)",
    ],
    no: [],
    recommended: true,
    href: "/aed/yuwell-y2",
  },
];

const between = ["+ แผ่น CPR feedback", "+ จอแสดงผลสด"];

export function ModelLadder() {
  return (
    <div className="text-gray-900">
      <div className="grid items-stretch gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
        {steps.map((s, i) => (
          <div key={s.id} className="contents">
            <article
              className={`relative flex flex-col rounded-2xl border-2 bg-white p-4 shadow-sm ${
                s.recommended ? "border-yellow-400 shadow-yellow-400/30 shadow-lg" : "border-gray-200"
              } ${s.discontinued ? "opacity-60" : ""}`}
            >
              <span
                className={`absolute -top-3 left-4 rounded-full px-3 py-0.5 text-xs font-bold ${
                  s.recommended
                    ? "bg-yellow-400 text-yellow-950"
                    : s.discontinued
                      ? "bg-gray-500 text-white"
                      : "bg-red-600 text-white"
                }`}
              >
                {s.label}
              </span>
              <div className={`relative mt-2 aspect-[4/3] w-full overflow-hidden rounded-xl bg-white ${s.discontinued ? "hidden md:block" : ""}`}>
                <Image
                  src={s.image}
                  alt={s.imageAlt}
                  fill
                  className={`object-contain ${s.discontinued ? "grayscale" : ""}`}
                  sizes="(max-width: 768px) 100vw, 30vw"
                />
                {s.discontinued && (
                  <span className="absolute inset-0 m-auto h-fit w-fit -rotate-12 rounded-lg border-4 border-gray-500 px-3 py-1 text-xl font-black text-gray-600">
                    {Y8_STATUS}
                  </span>
                )}
              </div>
              <h3 className="mt-3 text-lg font-extrabold">{s.name}</h3>
              <div className={`text-2xl font-black ${s.discontinued ? "text-gray-500" : "text-red-600"}`}>
                {s.price}
                {!s.discontinued && <span className="ml-1 text-xs font-normal text-gray-500">ก่อน VAT</span>}
              </div>
              <ul className="mt-3 flex-1 space-y-1.5 text-sm">
                {s.yes.map((t) => (
                  <li key={t} className="flex gap-2">
                    <span className="font-bold text-green-600">✓</span>
                    <span>{t}</span>
                  </li>
                ))}
                {s.no.map((t) => (
                  <li key={t} className="flex gap-2 text-gray-500">
                    <span className="font-bold">✗</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
              {!s.discontinued && (
                <Link
                  href={s.href}
                  className={`mt-4 rounded-full py-2 text-center text-sm font-bold ${
                    s.recommended ? "bg-yellow-400 text-yellow-950 hover:bg-yellow-300" : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                  }`}
                >
                  ดูรายละเอียด
                </Link>
              )}
            </article>
            {i < between.length && (
              <div className="flex items-center justify-center">
                <span className="rounded-full bg-red-600 px-3 py-1.5 text-center text-xs font-bold text-white">
                  {between[i]} <span className="md:hidden">↓</span><span className="hidden md:inline">→</span>
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
