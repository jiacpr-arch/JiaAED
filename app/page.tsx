import Image from "next/image";

const LINE_OA = "https://line.me/R/ti/p/@273fzpzs";

const products = [
  {
    id: "i7",
    name: "AED Amoul i7",
    subtitle: "รุ่นมาตรฐาน",
    price: 39999,
    msrp: 41900,
    description: "เหมาะสำหรับสำนักงาน โรงเรียน และสถานที่ทั่วไป",
    features: ["น้ำหนัก 2 กก. (รวมแบตเตอรี่)", "เสียงแนะนำภาษาไทย", "ใช้ได้ทั้งผู้ใหญ่และเด็ก", "รับประกัน 1 ปี"],
    badge: null,
  },
  {
    id: "i7-cabinet",
    name: "AED Amoul i7 + ตู้",
    subtitle: "รุ่นพร้อมตู้ติดผนัง",
    price: 44999,
    msrp: 46900,
    description: "ครบชุด พร้อมตู้ติดผนังและสัญญาณเตือน",
    features: ["ครบชุดพร้อมติดตั้ง", "ตู้กันฝุ่นกันน้ำ IP65", "สัญญาณเตือนเปิดตู้", "รับประกัน 1 ปี"],
    badge: "ยอดนิยม",
  },
  {
    id: "i7-floor",
    name: "AED Amoul i7 + แท่นตั้งพื้น",
    subtitle: "รุ่นแท่นตั้งพื้น",
    price: 49000,
    msrp: 51900,
    description: "เคลื่อนย้ายได้ เหมาะสำหรับสถานที่ขนาดใหญ่",
    features: ["เคลื่อนย้ายได้สะดวก", "แท่นตั้งพื้นมั่นคง", "มองเห็นได้ชัด", "รับประกัน 1 ปี"],
    badge: null,
  },
];

const specs = [
  { label: "น้ำหนัก", value: "2 กิโลกรัม (รวมแบตเตอรี่)" },
  { label: "ผู้ใช้งาน", value: "ผู้ใหญ่และเด็ก" },
  { label: "ภาษาเสียงแนะนำ", value: "ภาษาไทย (พร้อมภาพนิ่งบนเครื่อง)" },
  { label: "พลังงานสูงสุด", value: "360 Joules (BTE Waveform)" },
  { label: "พลังงาน Shock ผู้ใหญ่", value: "200J (ปรับได้ 100–360J)" },
  { label: "พลังงาน Shock เด็ก", value: "50J (ปรับได้ 10–100J)" },
  { label: "เวลาชาร์จพร้อม Shock", value: "< 7 วินาที" },
  { label: "แบตเตอรี่", value: "Lithium 4,500 mAh อายุ ≥ 7 ปี" },
  { label: "จำนวน Shock ต่อชาร์จ", value: "≥ 420 ครั้ง ที่ 200J" },
  { label: "บันทึก ECG", value: "8 ชั่วโมง + เสียง 72 นาที (USB/WiFi)" },
  { label: "Self-test", value: "Daily / Weekly / Monthly / Runtime" },
  { label: "อุณหภูมิใช้งาน", value: "-25°C ถึง 60°C" },
  { label: "การเชื่อมต่อ", value: "USB / SIM Card / WiFi" },
  { label: "มาตรฐาน", value: "CE Mark · IP65 · ISO 13485 · EN 1789:2020" },
  { label: "อุปกรณ์ที่รวมมา", value: "Electrode pads + แบตเตอรี่ + กระเป๋า + คู่มือ" },
  { label: "รับประกัน", value: "1 ปี" },
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
            <a href="#specs" className="text-sm text-gray-400 hover:text-yellow-400 transition-colors hidden sm:block">สเปค</a>
            <a
              href={LINE_OA}
              target="_blank"
              rel="noopener noreferrer"
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
            <h1 className="text-4xl md:text-5xl font-black mb-4 leading-tight">
              AED Amoul i7<br />
              <span className="text-yellow-400">เครื่องกระตุก</span><br />
              หัวใจไฟฟ้า
            </h1>
            <p className="text-gray-400 text-lg mb-6">
              Shock พร้อมใน <strong className="text-white">7 วินาที</strong> · เสียงแนะนำภาษาไทย<br />
              IP65 กันน้ำ กันฝุ่น · ใช้ได้ทั้งผู้ใหญ่และเด็ก
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <a
                href={LINE_OA}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#06C755] text-white font-bold text-lg px-8 py-4 rounded-full hover:bg-[#05a847] transition-colors text-center shadow-lg"
              >
                💬 คุยกับ AI เจี่ย — ฟรี!
              </a>
              <a
                href="#products"
                className="bg-yellow-400/10 text-yellow-400 font-semibold text-lg px-8 py-4 rounded-full border border-yellow-400/30 hover:bg-yellow-400/20 transition-colors text-center"
              >
                ดูราคา →
              </a>
            </div>
            <p className="text-gray-500 text-sm">ตอบทันที 24 ชั่วโมง • ออกใบเสนอราคาได้เลย</p>
          </div>
          <div className="flex justify-center">
            <div className="relative w-80 h-80">
              <Image
                src="/images/product-main.png"
                alt="AED Amoul i7"
                fill
                className="object-contain drop-shadow-2xl"
                priority
              />
            </div>
          </div>
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

      {/* Products */}
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
            {["CE Mark", "IP65", "ISO 13485", "EN 1789:2020", "AHA 2015"].map((cert) => (
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
            className="inline-block bg-[#06C755] text-white font-bold text-xl px-10 py-4 rounded-full hover:bg-[#05a847] transition-colors shadow-2xl"
          >
            💬 เพิ่มเพื่อน LINE @273fzpzs
          </a>
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
