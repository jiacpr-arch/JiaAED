import Image from "next/image";
import Link from "next/link";
import { products } from "@/lib/aed/products";
import { faqs } from "@/lib/aed/faqs";
import { rentalPlans } from "@/lib/aed/rental";
import { LeadForm } from "./components/LeadForm";
import { MiniLeadForm } from "./components/MiniLeadForm";
import { HeroCta } from "./components/HeroCta";
import { HeroHeadline } from "./components/HeroHeadline";
import { YouTubeLite } from "./components/YouTubeLite";
import { PriceViewTracker } from "./components/PriceViewTracker";
import { LatestNews } from "./components/LatestNews";

export const revalidate = 3600;

const LINE_OA = "https://line.me/R/ti/p/@273fzpzs";

const specs = [
  { label: "น้ำหนัก", value: "ประมาณ 2.0 กก. (รวมแบตเตอรี่)" },
  { label: "ผู้ใช้งาน", value: "ผู้ใหญ่ และ เด็ก (<8 ปี หรือ <25 กก.) — สลับโหมดด้วยสวิตช์" },
  { label: "ภาษาเสียงแนะนำ", value: "5 ภาษา: ไทย · อังกฤษ · จีน · สเปน · อิตาลี" },
  { label: "พลังงานสูงสุด", value: "360 Joules (BTE Biphasic Waveform)" },
  { label: "พลังงาน Shock ผู้ใหญ่", value: "Escalating 6 ระดับ: 100 → 150 → 170 → 200 → 300 → 360 J" },
  { label: "พลังงาน Shock เด็ก", value: "Escalating 7 ระดับ: 10 → 15 → 20 → 30 → 50 → 70 → 100 J" },
  { label: "การปรับพลังงาน", value: "Auto ตาม Patient Impedance (ผู้ใช้ตั้งค่าเองไม่ได้)" },
  { label: "เวลาชาร์จพร้อม Shock", value: "< 7 วินาที" },
  { label: "แบตเตอรี่", value: "Lithium 4,500 mAh · 12V (แบบใช้แล้วทิ้ง ชาร์จใหม่ไม่ได้)" },
  { label: "อายุแบตเตอรี่", value: "≥ 5 ปี (สแตนด์บายในเครื่อง) · ≥ 7 ปี (เก็บแยกในอุณหภูมิเหมาะสม)" },
  { label: "จำนวน Shock ต่อชาร์จ", value: "≥ 420 ครั้ง ที่ 200J (ทดสอบมาตรฐาน)" },
  { label: "บันทึก ECG", value: "≥ 8 ชั่วโมง · เหตุการณ์ ≥ 1,500 รายการ" },
  { label: "Self-test", value: "อัตโนมัติ — รายวัน / รายสัปดาห์ / รายเดือน" },
  { label: "อุณหภูมิใช้งาน", value: "-25°C ถึง 60°C" },
  { label: "การเชื่อมต่อ", value: "USB · Wi-Fi · SIM (4G) — เลือกใช้เมื่อเปิด AED Management Platform" },
  { label: "โหมดการทำงาน", value: "Standalone (ค่าเริ่มต้น) — ใช้ช่วยชีวิตได้โดยไม่ต้องเชื่อมต่อ" },
  { label: "มาตรฐาน", value: "CE Mark · ISO 13485 · IP65 · EN 1789:2020 · ILCOR/AHA 2020-2025" },
  { label: "อุปกรณ์ที่รวมมา", value: "Electrode pads + แบตเตอรี่ + กระเป๋า + คู่มือไทย" },
];

const adultShocks = [
  { n: "Shock 1", j: "100 J" },
  { n: "Shock 2", j: "150 J" },
  { n: "Shock 3", j: "170 J" },
  { n: "Shock 4", j: "200 J" },
  { n: "Shock 5", j: "300 J" },
  { n: "Shock 6", j: "360 J" },
  { n: "Shock 7+", j: "360 J (cap max)" },
];

const pediatricShocks = [
  { n: "Shock 1", j: "10 J" },
  { n: "Shock 2", j: "15 J" },
  { n: "Shock 3", j: "20 J" },
  { n: "Shock 4", j: "30 J" },
  { n: "Shock 5", j: "50 J" },
  { n: "Shock 6", j: "70 J" },
  { n: "Shock 7", j: "100 J" },
  { n: "Shock 8+", j: "100 J (cap max)" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans">

      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-gray-950/90 backdrop-blur border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">❤️</span>
            <span className="font-bold text-xl text-yellow-400">JiaAED</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#features" className="text-sm text-gray-400 hover:text-yellow-400 transition-colors hidden sm:block">คุณสมบัติ</a>
            <a href="#products" className="text-sm text-gray-400 hover:text-yellow-400 transition-colors hidden sm:block">สินค้า</a>
            <a href="#rental" className="text-sm text-gray-400 hover:text-yellow-400 transition-colors hidden sm:block">เช่า AED</a>
            <a href="#shock-protocol" className="text-sm text-gray-400 hover:text-yellow-400 transition-colors hidden md:block">โปรแกรมช็อก</a>
            <a href="#specs" className="text-sm text-gray-400 hover:text-yellow-400 transition-colors hidden sm:block">สเปค</a>
            <a href="#contact" className="text-sm text-gray-400 hover:text-yellow-400 transition-colors hidden sm:block">ติดต่อ</a>
            <a href="#faq" className="text-sm text-gray-400 hover:text-yellow-400 transition-colors hidden sm:block">FAQ</a>
            <Link href="/docs" className="text-sm text-gray-400 hover:text-yellow-400 transition-colors hidden sm:block">เอกสาร</Link>
            <Link href="/articles" className="text-sm text-gray-400 hover:text-yellow-400 transition-colors hidden sm:block">บทความ</Link>
            <Link href="/news" className="text-sm text-gray-400 hover:text-yellow-400 transition-colors hidden sm:block">ข่าว</Link>
            <a
              href={LINE_OA}
              target="_blank"
              rel="noopener noreferrer"
              data-line-cta="navbar"
              className="bg-[#06C755] text-white text-sm font-semibold px-5 py-2 rounded-full hover:bg-[#05a847] transition-colors"
            >
              💬 ถามราคา
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-950 via-gray-900 to-yellow-950 py-16 px-4">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-block bg-yellow-400/10 text-yellow-400 text-xs font-semibold px-3 py-1 rounded-full mb-4 border border-yellow-400/20">
              🏅 ทะเบียน อย. 68-2-2-2-0005243 · ฆพ.743/2569
            </div>
            <HeroHeadline />
            <p className="text-gray-400 text-lg mb-4">
              Shock พร้อมใน <strong className="text-white">7 วินาที</strong> · เสียงแนะนำภาษาไทย<br />
              IP65 กันน้ำ กันฝุ่น · ใช้ได้ทั้งผู้ใหญ่และเด็ก
            </p>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-6 bg-yellow-400/5 border border-yellow-400/30 rounded-2xl px-5 py-4 inline-flex">
              <span className="text-xs text-gray-400">เริ่มต้น</span>
              <span className="text-4xl md:text-5xl font-black text-yellow-400">฿39,999</span>
              <span className="text-gray-500 line-through text-base">฿70,000</span>
              <span className="text-xs text-gray-500 w-full">ราคาก่อน VAT · ออกใบเสนอราคาได้</span>
            </div>
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-300 mb-5">
              <li className="flex items-center gap-1.5"><span className="text-green-400">✓</span> อย. รับรอง</li>
              <li className="flex items-center gap-1.5"><span className="text-green-400">✓</span> ส่งทั่วประเทศ</li>
              <li className="flex items-center gap-1.5"><span className="text-green-400">✓</span> ออกใบกำกับภาษี</li>
            </ul>
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <HeroCta />
              <a
                href="#products"
                className="bg-yellow-400/10 text-yellow-400 font-semibold text-lg px-8 py-4 rounded-full border border-yellow-400/30 hover:bg-yellow-400/20 transition-colors text-center"
              >
                ดูทั้ง 3 รุ่น →
              </a>
            </div>
            <p className="text-gray-500 text-sm">ตอบทันที 24 ชั่วโมง • ออกใบเสนอราคาได้เลย</p>
          </div>
          <div className="flex justify-center">
            <a
              href={LINE_OA}
              target="_blank"
              rel="noopener noreferrer"
              data-line-cta="hero_product_image"
              className="relative w-80 h-80 group cursor-pointer"
              aria-label="คลิกเพื่อสอบถามทาง LINE"
            >
              <Image
                src="/images/product-main.png"
                alt="AED Amoul i7"
                fill
                className="object-contain drop-shadow-2xl transition-transform group-hover:scale-105"
                priority
              />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-[#06C755] text-white text-xs font-bold px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                💬 คลิกเพื่อสอบถาม
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* Quick contact bar — for ad traffic that wants direct callback */}
      <section className="bg-gray-900 border-y border-gray-800 py-6 px-4">
        <div className="max-w-3xl mx-auto">
          <MiniLeadForm />
        </div>
      </section>

      {/* Lifestyle banner */}
      <section className="relative h-64 md:h-80 overflow-hidden">
        <Image src="/images/lifestyle-cpr.png" alt="AED ในสถานการณ์จริง" fill className="object-cover object-center" />
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
          <div className="text-center text-white px-4">
            <p className="text-2xl md:text-4xl font-black">ทุกวินาทีคือชีวิต</p>
            <p className="text-gray-300 mt-2 text-lg">Shock พร้อมใน 7 วินาที ลดการเสียชีวิตได้ 70%</p>
          </div>
        </div>
      </section>

      {/* Feature graphic */}
      <section id="features" className="py-14 px-4 bg-gray-900">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-2 text-white">เทคโนโลยีครบทุกมิติ</h2>
          <p className="text-center text-gray-500 text-sm mb-8">ออกแบบมาเพื่อช่วยชีวิตในทุกสถานการณ์</p>
          <div className="rounded-2xl overflow-hidden shadow-2xl border border-gray-700">
            <Image src="/images/feature-grid.jpg" alt="i-SHOCK i-SAVE i-LOOK i-CARE" width={1080} height={1080} className="w-full h-auto" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 text-center text-sm">
            {[
              { icon: "⚡", name: "i-SHOCK", desc: "360J พร้อมใน 7 วินาที" },
              { icon: "❤️", name: "i-SAVE", desc: "วิเคราะห์คลื่นหัวใจอัตโนมัติ" },
              { icon: "🖥️", name: "i-LOOK", desc: "จอแสดงขั้นตอนการใช้งาน" },
              { icon: "📡", name: "i-CARE", desc: "บันทึก ECG ส่งข้อมูลผ่าน WiFi" },
            ].map((f) => (
              <div key={f.name} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <div className="text-2xl mb-1">{f.icon}</div>
                <div className="font-bold text-yellow-400">{f.name}</div>
                <div className="text-gray-400 text-xs mt-1">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Waterproof */}
      <section className="py-14 px-4 bg-gray-950">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8 items-center">
          <div className="rounded-2xl overflow-hidden shadow-2xl border border-gray-800">
            <Image src="/images/waterproof.jpeg" alt="AED IP65 กันน้ำ" width={600} height={400} className="w-full h-auto" />
          </div>
          <div>
            <div className="inline-block bg-yellow-400/10 text-yellow-400 text-xs font-bold px-3 py-1 rounded-full mb-3 border border-yellow-400/20">🛡️ IP65 CERTIFIED</div>
            <h2 className="text-3xl font-black mb-4 text-white">กันน้ำ กันฝุ่น<br />พร้อมทุกสภาพแวดล้อม</h2>
            <p className="text-gray-400 mb-5">ผ่านมาตรฐาน IP65 ทนต่อละอองน้ำและฝุ่น ใช้งานได้ทั้งในอาคารและกลางแจ้ง อุณหภูมิ -25°C ถึง 60°C</p>
            <ul className="space-y-3">
              {["กันน้ำ กันฝุ่น IP65", "อุณหภูมิ -25°C ถึง 60°C", "Self-test อัตโนมัติทุกวัน", "แบตเตอรี่อายุ ≥ 7 ปี"].map(f => (
                <li key={f} className="flex items-center gap-3 text-gray-300">
                  <span className="text-yellow-400 font-bold text-lg">✓</span>{f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Easy to use */}
      <section className="py-14 px-4 bg-gray-900">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8 items-center">
          <div className="order-2 md:order-1">
            <div className="inline-block bg-yellow-400/10 text-yellow-400 text-xs font-bold px-3 py-1 rounded-full mb-3 border border-yellow-400/20">👥 ใช้งานง่าย</div>
            <h2 className="text-3xl font-black mb-4 text-white">ไม่ต้องฝึก<br />ก็ใช้ได้ทันที</h2>
            <p className="text-gray-400 mb-6">เสียงแนะนำภาษาไทยทีละขั้นตอน พร้อมภาพนิ่งบนหน้าจอ ทุกคนในองค์กรสามารถใช้ได้ทันทีที่เกิดเหตุฉุกเฉิน</p>
            <a
              href={LINE_OA}
              target="_blank"
              rel="noopener noreferrer"
              data-line-cta="easy_use"
              className="inline-block bg-[#06C755] text-white font-bold px-6 py-3 rounded-full hover:bg-[#05a847] transition-colors"
            >
              💬 สอบถามราคา
            </a>
          </div>
          <div className="order-1 md:order-2 rounded-2xl overflow-hidden shadow-2xl border border-gray-700">
            <Image src="/images/lifestyle-man.jpeg" alt="ใช้งาน AED ง่าย" width={600} height={400} className="w-full h-auto" />
          </div>
        </div>
      </section>

      {/* Demo video */}
      <section className="py-14 px-4 bg-gray-950 border-t border-gray-900">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6">
            <div className="inline-block bg-yellow-400/10 text-yellow-400 text-xs font-bold px-3 py-1 rounded-full mb-3 border border-yellow-400/20">🎬 วิดีโอสาธิต</div>
            <h2 className="text-2xl md:text-3xl font-black text-white mb-2">ดูวิธีการใช้งานเครื่อง AED</h2>
            <p className="text-gray-400 text-sm">ทีละขั้นตอน — ใช้ได้ทันที ไม่ต้องอบรม</p>
          </div>
          <YouTubeLite videoId="ayov6IVgW7w" title="วิธีการใช้งานเครื่อง AED" />
        </div>
      </section>

      {/* Why JiaAED — trust section */}
      <section className="py-14 px-4 bg-gray-950 border-t border-gray-900">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-2 text-white">ทำไมเลือก JiaAED</h2>
          <p className="text-center text-gray-500 text-sm mb-10">เจี่ยรักษา — ผู้นำเข้าและจัดจำหน่ายเครื่องมือแพทย์</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                icon: "🏥",
                title: "นำเข้าโดยผู้เชี่ยวชาญ",
                desc: "เจี่ยรักษา จำหน่ายเครื่องมือแพทย์โดยตรง ไม่ผ่านคนกลาง ราคาตรงจากผู้นำเข้า",
              },
              {
                icon: "📜",
                title: "อย. รับรอง · ใบโฆษณาถูกต้อง",
                desc: "ทะเบียน อย. 68-2-2-2-0005243 และใบอนุญาตโฆษณา ฆพ.743/2569 ตรวจสอบได้",
              },
              {
                icon: "🛠️",
                title: "บริการหลังการขาย",
                desc: "ทีมเทคนิคไทยพร้อมให้คำปรึกษาและดูแลตลอดอายุการใช้งาน 7+ ปี",
              },
              {
                icon: "🇹🇭",
                title: "เสียงแนะนำภาษาไทย",
                desc: "ปุ่มกดและเสียงนำทางเป็นภาษาไทยทั้งหมด ทุกคนในองค์กรใช้ได้ทันที",
              },
              {
                icon: "💳",
                title: "ออกใบกำกับภาษี/ใบเสนอราคาได้",
                desc: "รองรับการจัดซื้อภาครัฐ โรงพยาบาล และองค์กร พร้อมเอกสารครบ",
              },
              {
                icon: "🚚",
                title: "จัดส่งทั่วประเทศ",
                desc: "พร้อมติดตั้งและสาธิตการใช้งาน — สอบถามทาง LINE ได้ทันที",
              },
            ].map((t) => (
              <div
                key={t.title}
                className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-yellow-400/40 transition-colors"
              >
                <div className="text-3xl mb-2">{t.icon}</div>
                <div className="font-bold text-white mb-1">{t.title}</div>
                <div className="text-gray-400 text-sm leading-relaxed">{t.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products */}
      <PriceViewTracker />
      <section id="products" className="py-14 px-4 bg-gray-950">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-2 text-white">เลือกรุ่นที่ใช่สำหรับคุณ</h2>
          <p className="text-center text-gray-500 mb-10">สอบถามราคาพิเศษองค์กรได้ทาง LINE</p>

          {/* Package showcase banners */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <a
              href={LINE_OA}
              target="_blank"
              rel="noopener noreferrer"
              data-line-cta="banner_floorstand"
              data-product="i7-floor"
              className="group rounded-2xl overflow-hidden border border-gray-800 bg-white hover:border-yellow-400/60 hover:shadow-2xl hover:shadow-yellow-400/10 transition-all"
            >
              <Image
                src="/images/aed-floorstand.png"
                alt="AED Amoul i7 + แท่นตั้งพื้น"
                width={1536}
                height={1024}
                className="w-full h-auto group-hover:scale-[1.02] transition-transform duration-300"
              />
            </a>
            <a
              href={LINE_OA}
              target="_blank"
              rel="noopener noreferrer"
              data-line-cta="banner_wallcabinet"
              data-product="i7-cabinet"
              className="group rounded-2xl overflow-hidden border border-gray-800 bg-white hover:border-yellow-400/60 hover:shadow-2xl hover:shadow-yellow-400/10 transition-all"
            >
              <Image
                src="/images/aed-wallcabinet.png"
                alt="AED Amoul i7 + ตู้ติดผนัง"
                width={1536}
                height={1024}
                className="w-full h-auto group-hover:scale-[1.02] transition-transform duration-300"
              />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {products.map((p) => (
              <div
                key={p.id}
                className={`relative rounded-2xl border p-6 flex flex-col bg-gray-900 ${
                  p.badge ? "border-yellow-400/60 shadow-lg shadow-yellow-400/10" : "border-gray-700"
                }`}
              >
                {p.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 text-xs font-bold px-4 py-1 rounded-full">
                    {p.badge}
                  </div>
                )}
                <div className="relative w-full h-44 mb-4 rounded-xl overflow-hidden bg-gray-800">
                  <Image src="/images/product-main.png" alt={p.name} fill className="object-contain p-3" />
                </div>
                <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">{p.subtitle}</div>
                <h3 className="font-bold text-lg text-white mt-1 mb-3">{p.name}</h3>
                <div className="mb-3">
                  <div className="text-gray-600 text-sm line-through">฿{p.msrp.toLocaleString()}</div>
                  <div className="text-3xl font-bold text-yellow-400">฿{p.price.toLocaleString()}</div>
                  <div className="text-gray-600 text-xs">ราคาเริ่มต้น (ยังไม่รวม VAT)</div>
                </div>
                <p className="text-gray-400 text-sm mb-4">{p.description}</p>
                <ul className="space-y-1 mb-6 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                      <span className="text-yellow-400 flex-shrink-0">✓</span>{f}
                    </li>
                  ))}
                </ul>
                <a
                  href={LINE_OA}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-line-cta="product_card"
                  data-product={p.id}
                  className={`text-center font-semibold py-3 rounded-full transition-colors ${
                    p.badge
                      ? "bg-yellow-400 text-yellow-900 hover:bg-yellow-300"
                      : "bg-gray-800 text-gray-200 hover:bg-gray-700 border border-gray-700"
                  }`}
                >
                  สั่งซื้อ / ถามราคา
                </a>
              </div>
            ))}
          </div>
          <p className="text-center text-gray-600 text-sm mt-6">
            * ราคาพิเศษสำหรับองค์กร โรงพยาบาล และหน่วยงานภาครัฐ — สอบถามทาง LINE ได้เลย
          </p>
        </div>
      </section>

      {/* Rental */}
      <section id="rental" className="py-14 px-4 bg-gray-950 border-t border-gray-900">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-3">
            <div className="inline-block bg-yellow-400/10 text-yellow-400 text-xs font-bold px-3 py-1 rounded-full mb-3 border border-yellow-400/20">
              💼 เช่า / เช่ายืม AED
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white mb-2">ไม่อยากซื้อขาด? เช่าใช้ได้ทันที</h2>
          </div>
          <p className="text-center text-gray-500 mb-10 max-w-2xl mx-auto">
            AED Amoul i7 พร้อมใช้งาน — รวมส่ง+ติดตั้ง อบรมใช้งาน และเปลี่ยนเครื่องสำรองถ้าเครื่องมีปัญหา เหมาะกับงานอีเวนต์ ออฟฟิศ โรงงาน ฟิตเนส และหน่วยงานชั่วคราว
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {rentalPlans.map((p) => (
              <div
                key={p.id}
                className={`relative rounded-2xl border p-6 flex flex-col bg-gray-900 ${
                  p.badge ? "border-yellow-400/60 shadow-lg shadow-yellow-400/10" : "border-gray-700"
                }`}
              >
                {p.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 text-xs font-bold px-4 py-1 rounded-full">
                    {p.badge}
                  </div>
                )}
                <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">{p.subtitle}</div>
                <h3 className="font-bold text-lg text-white mt-1 mb-3">{p.name}</h3>
                <div className="mb-3">
                  <div className="flex items-end gap-1">
                    <span className="text-3xl font-bold text-yellow-400">฿{p.price.toLocaleString()}</span>
                    <span className="text-gray-500 text-sm mb-1">{p.unit}</span>
                  </div>
                  <div className="text-gray-600 text-xs">ราคายังไม่รวม VAT</div>
                </div>
                <div className="text-gray-400 text-xs mb-4">มัดจำ {p.deposit}</div>
                <ul className="space-y-1 mb-6 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                      <span className="text-yellow-400 flex-shrink-0">✓</span>{f}
                    </li>
                  ))}
                </ul>
                <a
                  href={LINE_OA}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-line-cta="rental_card"
                  data-product={p.id}
                  className={`text-center font-semibold py-3 rounded-full transition-colors ${
                    p.badge
                      ? "bg-yellow-400 text-yellow-900 hover:bg-yellow-300"
                      : "bg-gray-800 text-gray-200 hover:bg-gray-700 border border-gray-700"
                  }`}
                >
                  สอบถาม / จองเช่า
                </a>
              </div>
            ))}
          </div>
          <p className="text-center text-gray-600 text-sm mt-6">
            * มัดจำคืนเต็มเมื่อคืนเครื่องครบสภาพ · ราคาพิเศษสำหรับสัญญาระยะยาว/หลายเครื่อง — สอบถามทาง LINE ได้เลย
          </p>
        </div>
      </section>

      {/* Escalating Shock Protocol */}
      <section id="shock-protocol" className="py-14 px-4 bg-gray-950 border-t border-gray-900">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-block bg-yellow-400/10 text-yellow-400 text-xs font-bold px-3 py-1 rounded-full mb-3 border border-yellow-400/20">
              ⚡ ESCALATING ENERGY PROTOCOL
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white mb-2">โปรแกรมการช็อกที่ตั้งค่าไม่ได้</h2>
            <p className="text-gray-400 text-sm max-w-2xl mx-auto">
              เครื่องของเราใช้ escalating protocol ตาม international guidelines เริ่มต่ำเพื่อลด myocardial damage แล้วเพิ่มเมื่อจำเป็น เป็น standard ที่ AHA recognize
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-900 border border-red-400/30 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-red-400">ADULT (ผู้ใหญ่) — 6 ระดับ</h3>
                <span className="text-xs text-gray-500">100 → 360 J</span>
              </div>
              <ul className="space-y-2">
                {adultShocks.map((s) => (
                  <li key={s.n} className="flex justify-between items-center bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-sm">
                    <span className="text-gray-400 font-medium">{s.n}</span>
                    <span className="text-red-400 font-bold">{s.j}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-gray-500 mt-3">↑ เพิ่มพลังงานอัตโนมัติเมื่อช็อกครั้งก่อนไม่สำเร็จ</p>
            </div>

            <div className="bg-gray-900 border border-green-400/30 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-green-400">PEDIATRIC (เด็ก) — 7 ระดับ</h3>
                <span className="text-xs text-gray-500">10 → 100 J</span>
              </div>
              <ul className="space-y-2">
                {pediatricShocks.map((s) => (
                  <li key={s.n} className="flex justify-between items-center bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-sm">
                    <span className="text-gray-400 font-medium">{s.n}</span>
                    <span className="text-green-400 font-bold">{s.j}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-gray-500 mt-3">สำหรับเด็ก &lt; 8 ปี หรือน้ำหนัก &lt; 25 กก.</p>
            </div>
          </div>

          {/* Medical Evidence */}
          <div className="mt-10 bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span>📚</span> EVIDENCE ทางการแพทย์
            </h3>
            <div className="grid md:grid-cols-3 gap-5 text-sm">
              <div>
                <div className="text-yellow-400 font-bold mb-2">Guidelines ILCOR/AHA 2020-2025</div>
                <ul className="space-y-1.5 text-gray-300">
                  <li className="flex items-start gap-2"><span className="text-green-400">✓</span><span>Escalating energy = acceptable strategy</span></li>
                  <li className="flex items-start gap-2"><span className="text-green-400">✓</span><span>Fixed high energy = also acceptable</span></li>
                  <li className="flex items-start gap-2"><span className="text-green-400">✓</span><span>Both have similar outcomes</span></li>
                </ul>
              </div>
              <div>
                <div className="text-yellow-400 font-bold mb-2">Studies</div>
                <ol className="space-y-1.5 text-gray-300 list-decimal list-inside">
                  <li><span className="font-semibold">BIPHASIC Trial (2007):</span> Escalating ≈ fixed high energy — termination rates ใกล้เคียง</li>
                  <li><span className="font-semibold">AHA 2020 Guidelines:</span> ทั้ง 2 กลยุทธ์ recommended — ไม่มี superiority</li>
                  <li><span className="font-semibold">ILCOR 2025 Update:</span> Initial 120-200J biphasic · Subsequent ≥ initial · 360J max</li>
                </ol>
              </div>
              <div>
                <div className="text-yellow-400 font-bold mb-2">First Shock Success Rates</div>
                <ul className="space-y-1.5 text-gray-300">
                  <li className="flex justify-between"><span>100J biphasic</span><span className="text-red-400 font-bold">70-80%</span></li>
                  <li className="flex justify-between"><span>150J biphasic</span><span className="text-red-400 font-bold">80-90%</span></li>
                  <li className="flex justify-between"><span>200J biphasic</span><span className="text-red-400 font-bold">85-90%</span></li>
                </ul>
                <div className="mt-3 pt-3 border-t border-gray-800">
                  <div className="text-xs text-gray-400 mb-1">After 3 shocks</div>
                  <div className="text-green-400 font-bold">Cumulative success &gt; 95%</div>
                  <div className="text-xs text-gray-500 mt-1">ส่วนใหญ่ไม่ต้องถึง 360J</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Connectivity & Operation Modes */}
      <section id="connectivity" className="py-14 px-4 bg-gray-900 border-t border-gray-800">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-block bg-blue-400/10 text-blue-400 text-xs font-bold px-3 py-1 rounded-full mb-3 border border-blue-400/20">
              📡 STANDALONE + OPTIONAL CONNECTIVITY
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white mb-2">ใช้งานได้ทันที — เชื่อมต่อเฉพาะเมื่อต้องการ</h2>
            <p className="text-gray-400 text-sm max-w-2xl mx-auto">
              AED Amoul i7 ทำงานแบบ Standalone เป็นค่าเริ่มต้น ช่วยชีวิตได้ทันทีโดยไม่ต้องเชื่อมต่อใดๆ — Connectivity จะใช้ก็ต่อเมื่อลูกค้าเปิดใช้ AED Management Platform เอง
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-950 border border-green-400/40 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">✅</span>
                <div>
                  <div className="text-xs text-green-400 font-bold uppercase tracking-wide">โหมดที่ 1 (ค่าเริ่มต้น)</div>
                  <h3 className="font-bold text-lg text-white">Standalone Mode</h3>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-start gap-2"><span className="text-green-400 mt-0.5">•</span><span>เครื่องทำงานเดี่ยว ไม่ส่งข้อมูลขึ้นส่วนกลาง</span></li>
                <li className="flex items-start gap-2"><span className="text-green-400 mt-0.5">•</span><span>ไม่ต้องเปิดใช้ dashboard หรือสมัครอะไรเพิ่ม</span></li>
                <li className="flex items-start gap-2"><span className="text-green-400 mt-0.5">•</span><span>ใช้ช่วยชีวิตได้ปกติทุกอย่าง — Self-test รายวันก็ทำให้เอง</span></li>
                <li className="flex items-start gap-2"><span className="text-green-400 mt-0.5">•</span><span>ดึง event log ผ่าน USB เมื่อตรวจสอบเครื่อง</span></li>
              </ul>
            </div>

            <div className="bg-gray-950 border border-blue-400/40 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">🔗</span>
                <div>
                  <div className="text-xs text-blue-400 font-bold uppercase tracking-wide">โหมดที่ 2 (ตัวเลือก)</div>
                  <h3 className="font-bold text-lg text-white">Connected Mode</h3>
                </div>
              </div>
              <p className="text-xs text-gray-400 mb-3">เมื่อต้องการดูข้อมูล ECG ขณะใช้เครื่องแบบ real-time:</p>
              <ol className="space-y-2 text-sm text-gray-300 list-decimal list-inside">
                <li>เปิดใช้ AED Management Platform</li>
                <li>ลงทะเบียนข้อมูลเครื่อง</li>
                <li>เลือกช่องทาง: USB / Wi-Fi / SIM 4G</li>
              </ol>
              <p className="text-xs text-blue-300 mt-3">→ จึงจะเข้าถึงข้อมูลผ่าน dashboard ได้</p>
            </div>
          </div>

          {/* Connectivity channels */}
          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                icon: "🔌",
                name: "USB",
                desc: "ดาวน์โหลด event log ออกได้ — ไม่ส่งอัตโนมัติ เก็บข้อมูลผ่าน USB เมื่อตรวจสอบ",
                color: "border-gray-700",
              },
              {
                icon: "📶",
                name: "Wi-Fi",
                desc: "ส่งข้อมูลขึ้นแพลตฟอร์มแบบ real-time ในพื้นที่ที่มี Wi-Fi ครอบคลุม",
                color: "border-gray-700",
              },
              {
                icon: "📡",
                name: "SIM (4G)",
                desc: "ส่งข้อมูลขึ้น real-time ผ่าน 4G cellular — สำหรับพื้นที่ไม่มี Wi-Fi",
                color: "border-gray-700",
              },
            ].map((c) => (
              <div key={c.name} className={`bg-gray-950 border ${c.color} rounded-xl p-5`}>
                <div className="text-3xl mb-2">{c.icon}</div>
                <div className="font-bold text-white mb-1">{c.name}</div>
                <p className="text-sm text-gray-400 leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-gray-500 mt-6">
            * รุ่น i7 ยังไม่มี GPS tracking (อยู่ระหว่างการพัฒนากับ supplier) · Wi-Fi/4G มีประโยชน์ก็ต่อเมื่อท่านเปิดใช้แพลตฟอร์ม
          </p>
        </div>
      </section>

      {/* Battery life */}
      <section className="py-14 px-4 bg-gray-950 border-t border-gray-800">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-block bg-yellow-400/10 text-yellow-400 text-xs font-bold px-3 py-1 rounded-full mb-3 border border-yellow-400/20">
              🔋 LONG-LIFE BATTERY
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white mb-2">อายุการใช้งานแบตเตอรี่</h2>
            <p className="text-gray-400 text-sm">Lithium 4,500 mAh · 12V · แบบใช้แล้วทิ้ง · &gt; 420 ครั้ง shock ที่ 200J</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center">
              <div className="text-5xl mb-2">⏱️</div>
              <div className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">กรณีสแตนด์บายปกติ</div>
              <div className="text-4xl font-black text-yellow-400 mb-1">มากกว่า 5 ปี</div>
              <p className="text-sm text-gray-400">(เครื่องออโต้เทสทุกวัน แต่ไม่ได้ส่งรายงานไร้สาย)</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center">
              <div className="text-5xl mb-2">📦</div>
              <div className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">กรณีเก็บแบตเตอรี่</div>
              <div className="text-4xl font-black text-yellow-400 mb-1">สูงสุด 7 ปี</div>
              <p className="text-sm text-gray-400">(แยกไว้ภายนอกเครื่อง ในอุณหภูมิที่เหมาะสม)</p>
            </div>
          </div>
        </div>
      </section>

      {/* Specs */}
      <section id="specs" className="py-14 px-4 bg-gray-900">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-2 text-white">คุณลักษณะเฉพาะ AED Amoul i7</h2>
          <p className="text-center text-gray-500 text-sm mb-8">Automated External Defibrillator รุ่น i7</p>
          <div className="rounded-2xl overflow-hidden border border-gray-700">
            {specs.map((s, i) => (
              <div key={s.label} className={`flex gap-4 px-6 py-4 ${i % 2 === 0 ? "bg-gray-900" : "bg-gray-800"}`}>
                <div className="w-44 flex-shrink-0 text-sm font-semibold text-gray-500">{s.label}</div>
                <div className="text-sm text-gray-200">{s.value}</div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 justify-center mt-6">
            {["CE Mark", "IP65", "ISO 13485", "EN 1789:2020", "ILCOR/AHA 2020-2025", "FDA"].map((cert) => (
              <span key={cert} className="bg-yellow-400/10 text-yellow-400 text-xs font-semibold px-3 py-1 rounded-full border border-yellow-400/20">
                ✓ {cert}
              </span>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-3 justify-center">
            <div className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-center">
              <div className="text-xs text-gray-400 font-semibold">เลขที่ใบรับแจ้ง อย.</div>
              <div className="text-sm font-bold text-yellow-400">68-2-2-2-0005243</div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-center">
              <div className="text-xs text-gray-400 font-semibold">ใบอนุญาตโฆษณา</div>
              <div className="text-sm font-bold text-yellow-400">ฆพ. 743/2569</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gray-950 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <Image src="/images/lifestyle-cpr.png" alt="" fill className="object-cover" />
        </div>
        <div className="relative max-w-xl mx-auto">
          <div className="text-yellow-400 text-4xl mb-4">❤️</div>
          <h2 className="text-3xl font-black mb-3 text-white">พร้อมปกป้องชีวิตแล้วใช่ไหม?</h2>
          <p className="text-gray-500 mb-8">คุยกับ AI เจี่ยทาง LINE — ตอบทันที ออกใบเสนอราคาได้เลย</p>
          <a
            href={LINE_OA}
            target="_blank"
            rel="noopener noreferrer"
            data-line-cta="footer_cta"
            className="inline-block bg-[#06C755] text-white font-bold text-xl px-10 py-4 rounded-full hover:bg-[#05a847] transition-colors shadow-2xl"
          >
            💬 เพิ่มเพื่อน LINE @273fzpzs
          </a>
        </div>
      </section>

      {/* Latest curated news — renders nothing until items exist */}
      <LatestNews limit={6} />

      {/* Lead form — alternative to LINE for ad traffic */}
      <section id="contact" className="py-14 px-4 bg-gray-950 border-t border-gray-800">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-2 text-white">ขอใบเสนอราคา / ติดต่อกลับ</h2>
          <p className="text-center text-gray-500 text-sm mb-2">
            ไม่สะดวกใช้ LINE? ฝากข้อมูลไว้ — ทีมงานจะติดต่อกลับภายใน 24 ชั่วโมง
          </p>
          <p className="text-center text-gray-500 text-sm mb-8">
            หรือ{" "}
            <a
              href="https://line.me/R/ti/p/@273fzpzs"
              target="_blank"
              rel="noopener noreferrer"
              data-line-cta="contact_section_link"
              className="text-yellow-400 hover:text-yellow-300 underline"
            >
              คุยทาง LINE ได้ทันที 24 ชั่วโมง →
            </a>
          </p>
          <LeadForm />
        </div>
      </section>

      {/* FAQ — for SEO/AEO */}
      <section id="faq" className="py-14 px-4 bg-gray-900 border-t border-gray-800">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-2 text-white">คำถามที่พบบ่อย</h2>
          <p className="text-center text-gray-500 text-sm mb-8">FAQ — AED Amoul i7</p>
          <div className="space-y-3">
            {faqs.map((f) => (
              <details
                key={f.question}
                className="group rounded-xl border border-gray-800 bg-gray-950 overflow-hidden"
              >
                <summary className="cursor-pointer list-none px-5 py-4 flex justify-between items-center gap-4 hover:bg-gray-800/50 transition-colors">
                  <span className="font-semibold text-white">{f.question}</span>
                  <span className="text-yellow-400 text-xl transition-transform group-open:rotate-45">+</span>
                </summary>
                <div className="px-5 pb-5 text-gray-300 text-sm leading-relaxed border-t border-gray-800 pt-4">
                  {f.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black border-t border-gray-800 text-gray-600 text-sm py-8 px-4 text-center">
        <p className="font-semibold text-gray-300 mb-1">JiaAED by เจี่ยรักษา</p>
        <p>จำหน่าย AED Amoul i7 · ทะเบียน อย. 68-2-2-2-0005243 · ใบโฆษณา ฆพ.743/2569</p>
        <p className="mt-3 text-xs text-gray-700">© {new Date().getFullYear()} JiaAED. All rights reserved.</p>
      </footer>

    </div>
  );
}
