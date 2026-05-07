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
    features: ["เคลื่อนย้ายได้", "แท่นตั้งพื้นมั่นคง", "มองเห็นได้ชัด", "รับประกัน 1 ปี"],
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
  { label: "อุณหภูมิใช้งาน", value: "-25°C ถึง 60°C / เก็บรักษา -30°C ถึง 70°C" },
  { label: "การเชื่อมต่อ", value: "USB / SIM Card / WiFi" },
  { label: "มาตรฐาน", value: "CE Mark · IP65 · ISO 13485 · EN 1789:2020" },
  { label: "อุปกรณ์ที่รวมมา", value: "Electrode pads + แบตเตอรี่ + กระเป๋า + คู่มือ" },
  { label: "รับประกัน", value: "1 ปี" },
];

const reasons = [
  { icon: "⚡", title: "Shock ภายใน 7 วินาที", desc: "ชาร์จพร้อม Shock ใน <7 วินาที ลดอัตราการเสียชีวิตได้ถึง 70%" },
  { icon: "👥", title: "ใช้งานง่าย ไม่ต้องฝึก", desc: "เสียงแนะนำภาษาไทยทีละขั้นตอน พร้อมภาพนิ่งบนเครื่อง" },
  { icon: "🏛️", title: "กฎหมายกำหนด", desc: "สถานที่สาธารณะ อาคารสูง และสถานประกอบการต้องติดตั้ง AED" },
  { icon: "🛡️", title: "มาตรฐานสากล", desc: "CE Mark · IP65 · ISO 13485 · AHA CPR Guideline 2015" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">

      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">❤️</span>
            <span className="font-bold text-lg text-red-600">JiaAED</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="#specs" className="text-sm text-gray-500 hover:text-gray-800 hidden sm:block">สเปคสินค้า</a>
            <a
              href={LINE_OA}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#06C755] text-white text-sm font-semibold px-4 py-2 rounded-full hover:bg-[#05a847] transition-colors"
            >
              💬 ถามราคา LINE
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-br from-red-50 to-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-block bg-red-100 text-red-700 text-sm font-semibold px-4 py-1 rounded-full mb-4">
            🚑 เครื่องช่วยชีวิต AED คุณภาพสูง
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            AED Amoul i7<br />
            <span className="text-red-600">เพื่อนรักที่อยู่เคียงข้าง</span><br />
            ในยามฉุกเฉิน
          </h1>
          <p className="text-gray-600 text-lg mb-6 max-w-xl mx-auto">
            น้ำหนักเบา 2 กก. · Shock พร้อมใน 7 วินาที · เสียงแนะนำภาษาไทย<br/>
            มาตรฐาน CE · IP65 · ISO 13485
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={LINE_OA}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#06C755] text-white font-bold text-lg px-8 py-4 rounded-full hover:bg-[#05a847] transition-colors shadow-lg shadow-green-200"
            >
              💬 คุยกับ AI เจี่ย — ฟรี!
            </a>
            <a
              href="#products"
              className="bg-white text-gray-700 font-semibold text-lg px-8 py-4 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              ดูสินค้า →
            </a>
          </div>
          <p className="text-gray-400 text-sm mt-4">ตอบทันที 24 ชั่วโมง • ออกใบเสนอราคาได้เลย</p>
        </div>
      </section>

      {/* Why AED */}
      <section className="py-14 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">ทำไมต้องมี AED?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {reasons.map((r) => (
              <div key={r.title} className="bg-white rounded-2xl p-6 shadow-sm text-center">
                <div className="text-4xl mb-3">{r.icon}</div>
                <h3 className="font-bold text-gray-900 mb-2">{r.title}</h3>
                <p className="text-gray-500 text-sm">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products */}
      <section id="products" className="py-14 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-2">เลือกรุ่นที่ใช่สำหรับคุณ</h2>
          <p className="text-center text-gray-500 mb-10">สอบถามราคาพิเศษองค์กรได้ทาง LINE</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {products.map((p) => (
              <div
                key={p.id}
                className={`relative rounded-2xl border-2 p-6 flex flex-col ${
                  p.badge ? "border-red-500 shadow-lg shadow-red-50" : "border-gray-100"
                }`}
              >
                {p.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                    {p.badge}
                  </div>
                )}
                <div className="text-center mb-4">
                  <div className="text-5xl mb-3">🫀</div>
                  <div className="text-xs text-gray-400 font-medium uppercase tracking-wide">{p.subtitle}</div>
                  <h3 className="font-bold text-lg text-gray-900 mt-1">{p.name}</h3>
                </div>
                <div className="text-center mb-4">
                  <div className="text-gray-400 text-sm line-through">฿{p.msrp.toLocaleString()}</div>
                  <div className="text-3xl font-bold text-red-600">฿{p.price.toLocaleString()}</div>
                  <div className="text-gray-400 text-xs mt-1">ราคาเริ่มต้น (ยังไม่รวม VAT)</div>
                </div>
                <p className="text-gray-500 text-sm text-center mb-4">{p.description}</p>
                <ul className="space-y-2 mb-6 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="text-green-500 flex-shrink-0">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href={LINE_OA}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-center font-semibold py-3 rounded-full transition-colors ${
                    p.badge
                      ? "bg-red-500 text-white hover:bg-red-600"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  สั่งซื้อ / ถามราคา
                </a>
              </div>
            ))}
          </div>
          <p className="text-center text-gray-400 text-sm mt-6">
            * ราคาพิเศษสำหรับองค์กร โรงพยาบาล และหน่วยงานภาครัฐ — สอบถามทาง LINE ได้เลย
          </p>
        </div>
      </section>

      {/* Specs */}
      <section id="specs" className="py-14 px-4 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-2">คุณลักษณะเฉพาะ AED Amoul i7</h2>
          <p className="text-center text-gray-500 text-sm mb-8">Automated External Defibrillator รุ่น i7</p>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {specs.map((s, i) => (
              <div
                key={s.label}
                className={`flex gap-4 px-6 py-4 ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
              >
                <div className="w-44 flex-shrink-0 text-sm font-semibold text-gray-500">{s.label}</div>
                <div className="text-sm text-gray-800">{s.value}</div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 justify-center mt-6">
            {["CE Mark", "IP65", "ISO 13485", "EN 1789:2020", "AHA 2015"].map((cert) => (
              <span key={cert} className="bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full border border-blue-100">
                ✓ {cert}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-gradient-to-br from-red-500 to-red-600 text-white text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-3xl font-bold mb-3">พร้อมปกป้องชีวิตแล้วใช่ไหม?</h2>
          <p className="text-red-100 mb-8">
            คุยกับ AI เจี่ยทาง LINE — ตอบทันที ออกใบเสนอราคาได้เลย ไม่มีค่าใช้จ่าย
          </p>
          <a
            href={LINE_OA}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-white text-green-600 font-bold text-xl px-10 py-4 rounded-full hover:bg-gray-50 transition-colors shadow-xl"
          >
            💬 เพิ่มเพื่อน LINE @273fzpzs
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 text-sm py-8 px-4 text-center">
        <p className="font-semibold text-white mb-1">JiaAED by เจี่ยรักษา</p>
        <p>จำหน่าย AED คุณภาพสูง บริการหลังการขายโดยผู้เชี่ยวชาญ</p>
        <p className="mt-3 text-xs text-gray-600">© {new Date().getFullYear()} JiaAED. All rights reserved.</p>
      </footer>

    </div>
  );
}
