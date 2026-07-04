import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/app/components/SiteHeader";
import { SiteFooter } from "@/app/components/SiteFooter";
import { SectionHeading } from "@/app/components/SectionHeading";

export const metadata: Metadata = {
  title: "นโยบายความเป็นส่วนตัว | JiaAED",
  description:
    "นโยบายความเป็นส่วนตัวของ JiaAED (เจี่ยรักษา) — ข้อมูลที่เราเก็บ วัตถุประสงค์ การใช้คุกกี้ และสิทธิของท่านตาม พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล (PDPA)",
  alternates: { canonical: "/privacy" },
};

const UPDATED = "4 กรกฎาคม 2569";

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl font-bold text-white mt-10 mb-3">{children}</h2>;
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans">
      <SiteHeader />

      <section className="max-w-3xl mx-auto px-4 py-10">
        <SectionHeading
          as="h1"
          badge="⚖️ PDPA"
          title="นโยบายความเป็นส่วนตัว"
          subtitle={`เจี่ยรักษา (JiaAED) · ปรับปรุงล่าสุด ${UPDATED}`}
        />

        <div className="text-gray-300 text-sm leading-relaxed mt-8">
          <p>
            เจี่ยรักษา (&quot;JiaAED&quot;, &quot;เรา&quot;) ให้ความสำคัญกับการคุ้มครองข้อมูลส่วนบุคคลของท่านตาม
            พระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA) นโยบายฉบับนี้อธิบายว่าเราเก็บข้อมูลอะไร
            นำไปใช้อย่างไร และท่านมีสิทธิอะไรบ้าง
          </p>

          <H2>1. ข้อมูลที่เราเก็บรวบรวม</H2>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong className="text-white">ข้อมูลที่ท่านให้เอง</strong> — ชื่อ เบอร์โทรศัพท์ อีเมล
              ชื่อหน่วยงาน และรายละเอียดความต้องการ เมื่อท่านกรอกฟอร์มขอใบเสนอราคา/ให้ติดต่อกลับ
              หรือสนทนากับเราผ่าน LINE OA และแชทบนเว็บไซต์
            </li>
            <li>
              <strong className="text-white">ข้อมูลการใช้งานเว็บไซต์</strong> — หน้าที่เข้าชม
              แหล่งที่มาของการเข้าชม (เช่น โฆษณา Google/Facebook) และตัวระบุการคลิกโฆษณา (gclid/fbclid)
              โดยที่อยู่ IP จะถูกแปลงเป็นรหัส (hash) ก่อนจัดเก็บ
            </li>
            <li>
              <strong className="text-white">คุกกี้และเทคโนโลยีติดตาม</strong> — ใช้เมื่อท่านกด
              &quot;ยอมรับทั้งหมด&quot; บนแบนเนอร์คุกกี้เท่านั้น (ดูข้อ 4)
            </li>
          </ul>

          <H2>2. วัตถุประสงค์ในการใช้ข้อมูล</H2>
          <ul className="list-disc pl-5 space-y-2">
            <li>ติดต่อกลับ จัดทำใบเสนอราคา และให้บริการหลังการขายตามที่ท่านร้องขอ</li>
            <li>ปรับปรุงเว็บไซต์ สินค้า และบริการของเรา</li>
            <li>วัดผลและปรับปรุงการโฆษณา (เฉพาะเมื่อท่านยินยอมรับคุกกี้การตลาด)</li>
            <li>ปฏิบัติตามกฎหมายที่เกี่ยวข้อง เช่น การออกใบกำกับภาษี</li>
          </ul>

          <H2>3. การเปิดเผยข้อมูลต่อบุคคลที่สาม</H2>
          <p>เราไม่ขายข้อมูลส่วนบุคคลของท่าน แต่ใช้ผู้ให้บริการต่อไปนี้ในการดำเนินงาน:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Supabase และ Vercel — โครงสร้างพื้นฐานจัดเก็บข้อมูลและโฮสต์เว็บไซต์</li>
            <li>LINE — ช่องทางสนทนาและแจ้งเตือน</li>
            <li>Google (Analytics / Ads) — วิเคราะห์การใช้งานและวัดผลโฆษณา*</li>
            <li>Meta (Facebook/Instagram Pixel &amp; Conversions API) — วัดผลโฆษณา*</li>
            <li>PostHog — วิเคราะห์พฤติกรรมการใช้งานเว็บไซต์*</li>
          </ul>
          <p className="text-gray-500 mt-2">* ทำงานเฉพาะเมื่อท่านยอมรับคุกกี้เท่านั้น</p>

          <H2>4. คุกกี้</H2>
          <p>
            เมื่อเข้าชมเว็บไซต์ครั้งแรก ท่านสามารถเลือก &quot;ยอมรับทั้งหมด&quot; หรือ
            &quot;ใช้เท่าที่จำเป็น&quot; ได้จากแบนเนอร์คุกกี้ — หากเลือกใช้เท่าที่จำเป็น
            ระบบวิเคราะห์และพิกเซลโฆษณา (Google, Meta, PostHog) จะไม่ถูกโหลด
            ท่านเปลี่ยนใจภายหลังได้โดยล้างข้อมูลเว็บไซต์ (localStorage) ของเบราว์เซอร์แล้วเลือกใหม่
          </p>

          <H2>5. ระยะเวลาจัดเก็บ</H2>
          <p>
            เราเก็บข้อมูลผู้สนใจสินค้า (lead) และประวัติการสนทนาไว้ตลอดระยะเวลาที่จำเป็นต่อการให้บริการ
            และไม่เกินระยะเวลาที่กฎหมายกำหนด ท่านขอให้ลบข้อมูลได้ทุกเมื่อตามข้อ 6
          </p>

          <H2>6. สิทธิของท่านตาม PDPA</H2>
          <p>
            ท่านมีสิทธิขอเข้าถึง ขอสำเนา ขอแก้ไข ขอลบ ขอระงับการใช้ ขอคัดค้านการประมวลผล
            และขอถอนความยินยอมเมื่อใดก็ได้ โดยติดต่อเราตามช่องทางในข้อ 7
            เราจะดำเนินการภายใน 30 วันนับจากได้รับคำขอ
          </p>

          <H2>7. ติดต่อผู้ควบคุมข้อมูล</H2>
          <ul className="list-disc pl-5 space-y-1">
            <li>เจี่ยรักษา (JiaAED)</li>
            <li>อีเมล: jiacpr@gmail.com</li>
            <li>LINE OA: @jiacpr</li>
          </ul>

          <p className="mt-10 text-gray-500">
            เราอาจปรับปรุงนโยบายนี้เป็นครั้งคราว โดยจะระบุวันที่ปรับปรุงล่าสุดไว้ด้านบนของหน้านี้
          </p>

          <p className="mt-6">
            <Link href="/" className="text-yellow-400 hover:underline">← กลับหน้าแรก</Link>
          </p>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
