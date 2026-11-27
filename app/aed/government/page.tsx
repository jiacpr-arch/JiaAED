import type { Metadata } from "next";
import Image from "next/image";
import { MarketPage, MarketHero, MarketButton } from "@/app/components/MarketShell";
import { CLOUD_SCREENSHOT } from "@/lib/aed/monitoring-page";
import { HERO_PHOTO } from "@/lib/aed/gps-rental-page";

// Draft for regulatory and commercial review. Do not publish until the
// jiaaed.com advertising scope and proposed copy have been approved.
export const metadata: Metadata = {
  title: "JIA Smart AED Network — ข้อมูลประกอบการศึกษาตลาดภาครัฐ",
  robots: { index: false, follow: false },
};

const models = [
  { name: "HeartSave Y8 GPS 4G", tag: "การดูแลเครื่องหลายพื้นที่", image: HERO_PHOTO.src, alt: HERO_PHOTO.alt, description: "รุ่นที่มีฟังก์ชันเครือข่าย สำหรับพิจารณาร่วมกับ PRIMEDIC CLOUD ตามขอบเขตบริการ", href: "/aed/gps-rental" },
  { name: "Yuwell HeartSave Y2", tag: "ข้อมูลคุณภาพ CPR บนหน้าจอ", image: "/images/primedic-y2-open.jpg", alt: "HeartSave Y2 เปิดฝาแสดงหน้าจอสี", description: "จอสีแสดงข้อมูล CPR ได้แก่ ความเร็ว ความลึก และการคืนตัวของหน้าอก ตามเอกสารผลิตภัณฑ์", href: "/aed/yuwell-y2" },
];

const sectionTitle = "mb-5 text-2xl font-extrabold md:text-4xl";
const card = "rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-sm";

export default function GovernmentAedPage() {
  return <MarketPage>
    <MarketHero eyebrow="JIA SMART AED NETWORK" title="ทางเลือกสำหรับเครือข่าย AED ภาครัฐ" description="ข้อมูลประกอบการสำรวจตลาด: เปรียบเทียบการจัดซื้อ การเช่าระยะยาว และการดูแลความพร้อมของเครื่อง โดยบริษัท เจี่ยรักษา จำกัด">
      <MarketButton href="/quote">ขอเอกสารข้อเสนอและนัดสาธิต</MarketButton>
      <MarketButton href="#models" secondary>เปรียบเทียบรุ่น</MarketButton>
    </MarketHero>
    <section id="models" className="market-section market-section-cream">
      <div className="market-container">
        <h2 className={sectionTitle}>เลือกเครื่องตามความต้องการของแต่ละพื้นที่</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {models.map(m => <article key={m.name} className={card}>
            <div className="relative mb-5 h-64 w-full"><Image src={m.image} alt={m.alt} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-contain" /></div>
            <p className="font-bold text-teal-700">{m.tag}</p><h3 className="my-2 text-2xl font-bold">{m.name}</h3><p className="mb-5">{m.description}</p>
            <MarketButton href={m.href}>ดูข้อมูลผลิตภัณฑ์</MarketButton>
          </article>)}
        </div>
        <p className="mt-5 text-sm">คุณสมบัติเครือข่ายของ Y8 ไม่ได้หมายความว่า Y2 รองรับ GPS หรือ Cloud เช่นเดียวกัน ต้องตรวจเอกสารของรุ่นที่เสนอและ TOR ฉบับจริง</p>
        <div className="mt-5"><MarketButton href="/aed/primedic" secondary>เอกสารและข้อมูลกลุ่มผลิตภัณฑ์ PRIMEDIC</MarketButton></div>
      </div>
    </section>
    <section className="market-section">
      <div className="market-container grid items-center gap-8 md:grid-cols-2">
        <div><p className="mb-2 font-bold">PRIMEDIC CLOUD / APPLICATION</p><h2 className={sectionTitle}>ตรวจสอบความพร้อมจากส่วนกลาง</h2>
        <p className="mb-4">ข้อมูลตำแหน่ง ผล Self-test สถานะแบตเตอรี่ แผ่นอิเล็กโทรด และการแจ้งเตือน ขึ้นอยู่กับรุ่นเครื่อง การเชื่อมต่อ และระดับบริการ</p>
        <p className="mb-4">ตัวอย่างระบบจริงและการค้นหาจุดติดตั้งผ่านแอปอยู่ในหน้าระบบ Monitoring การรายงานตำแหน่งไม่ใช่การติดตามสดต่อเนื่อง และไม่รับรองการเชื่อมต่อ NDEMS หรือศูนย์ 1669 โดยอัตโนมัติ</p>
        <MarketButton href="/aed/monitoring">ดูหน้าจอระบบจริงและวิธีใช้งาน</MarketButton></div>
        <Image src={CLOUD_SCREENSHOT.src} alt={CLOUD_SCREENSHOT.alt} width={CLOUD_SCREENSHOT.width} height={CLOUD_SCREENSHOT.height} className="h-auto w-full rounded-xl" sizes="(max-width: 768px) 100vw, 50vw" />
      </div>
    </section>
    <section className="market-section market-section-cream"><div className="market-container">
      <h2 className={sectionTitle}>เปรียบเทียบต้นทุนตลอดอายุโครงการ</h2>
      <div className="grid gap-6 md:grid-cols-2">
      <article className={card}><h3 className="mb-3 text-xl font-bold">จัดซื้อ</h3><p>แยกราคาเครื่อง ตู้ ติดตั้ง อบรม การรับประกัน อะไหล่ ค่าเครือข่าย และบำรุงรักษา เพื่อประเมิน TCO ตามระยะเวลาที่กำหนด</p><div className="mt-4"><MarketButton href="/aed/packages">ดูแพ็กเกจ</MarketButton></div></article>
      <article className={card}><h3 className="mb-3 text-xl font-bold">เช่าระยะยาว</h3><p>เปรียบเทียบสัญญา 3 และ 5 ปี โดยแจกแจงค่าเช่า เงินประกัน ค่าเครือข่าย การเปลี่ยนวัสดุสิ้นเปลือง การฝึกอบรม และบริการตาม SLA ที่ตกลง</p><div className="mt-4"><MarketButton href="/aed/gps-rental">ดูบริการเช่า GPS</MarketButton></div></article>
      </div>
      <p className="mt-5 text-sm">บริษัทพร้อมจัดทำราคาตามจำนวนและสเปกที่หน่วยงานกำหนด ตัวเลขโครงการต้องเปรียบเทียบขอบเขตเดียวกัน ไม่ใช่ใบเสนอราคาผูกพันหรือการรับรองว่าผ่าน TOR</p>
    </div></section>
    <section className="market-section"><div className="market-container">
      <h2 className={sectionTitle}>ข้อเสนอการสาธิตและทดสอบนำร่อง</h2>
      <p className="mb-5">เสนอหารือการทดสอบ 10–20 จุดตามกระบวนการจัดซื้อที่เกี่ยวข้อง โดยวัดความพร้อมของเครื่อง ความครบถ้วนของข้อมูล การแจ้งเตือน ระยะเวลาบริการ และต้นทุนต่อจุด ก่อนพิจารณาขยายผล</p>
      <div className="grid gap-4 md:grid-cols-3">{["เอกสารสเปกและทะเบียนเครื่องมือแพทย์","แผนการติดตั้งและอบรม CPR/AED","แผนบริการและต้นทุนตลอดสัญญา"].map(x=><div key={x} className={card}>{x}</div>)}</div>
      <p className="my-5">จำนวนที่จัดหาได้จริง กำหนดส่งมอบ พื้นที่บริการ SLA และการเชื่อมระบบฉุกเฉิน ต้องได้รับการยืนยันก่อนทำข้อเสนอผูกพัน บริษัทไม่ได้อ้างว่าได้รับคัดเลือกหรือเป็นพันธมิตรของหน่วยงานรัฐ</p>
      <div className="flex flex-wrap gap-3"><MarketButton href="/quote">ขอนัดสาธิตและสำรวจราคา</MarketButton><MarketButton href="/docs" secondary>เอกสารประกอบ</MarketButton><MarketButton href="/training" secondary>บริการฝึกอบรม</MarketButton></div>
    </div></section>
  </MarketPage>;
}
