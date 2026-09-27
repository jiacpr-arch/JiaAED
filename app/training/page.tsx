import type { Metadata } from "next";
import Image from "next/image";
import { MarketButton, MarketHero, MarketLead, MarketPage } from "@/app/components/MarketShell";
import { MiniLeadForm } from "@/app/components/MiniLeadForm";
import { instructorCredential, trainingImages, trainingValueProps } from "@/lib/aed/training";

export const metadata: Metadata = { title: "อบรม CPR และการใช้ AED ถึงองค์กร", description: `ฝึกปฏิบัติ CPR และ AED ถึงหน่วยงาน โดยวิทยากรที่ผ่าน ${instructorCredential.course}`, alternates: { canonical: "/training" } };

export default function TrainingPage() {
  return <MarketPage>
    <MarketHero eyebrow="CPR & AED TRAINING" title="มีเครื่องแล้ว ต้องมีคนกล้าใช้." description={`อบรม CPR และการใช้ AED แบบลงมือจริงถึงหน่วยงาน โดยวิทยากรที่ผ่าน ${instructorCredential.course}`} image={trainingImages[0]}><MarketButton href="#course">ดูหลักสูตร</MarketButton><MarketButton href="/quote" secondary>ขอราคาอบรม</MarketButton></MarketHero>
    <section className="market-section market-section-cream" id="course"><div className="market-container"><div className="market-section-head"><div><p className="market-eyebrow">PRACTICE MAKES READY</p><h2>ฝึกให้ทีมพร้อมลงมือ.</h2></div><p>เรียนรู้พร้อมฝึกปฏิบัติจริง เพื่อให้คนในองค์กรรู้ขั้นตอนและมั่นใจขึ้นเมื่อเจอเหตุฉุกเฉิน</p></div><div className="market-feature-grid">{trainingValueProps.map((v) => <div className="market-feature" key={v.title}><b>{v.title}</b><p>{v.desc}</p></div>)}</div></div></section>
    <section className="market-section"><div className="market-container market-split"><div className="market-split-photo"><Image src={trainingImages[1]} alt="วิทยากรผ่านการอบรม BLS Instructor Course" fill sizes="(max-width: 700px) 100vw, 45vw" /></div><div><p className="market-eyebrow">YOUR INSTRUCTOR</p><h2>วิทยากรที่มีประสบการณ์จริง.</h2><p>ผ่านหลักสูตร {instructorCredential.course} จาก{instructorCredential.issuer}</p><div className="market-step-list">{instructorCredential.points.map((p, i) => <div className="market-step" key={p}><b>0{i + 1}</b><strong>{p}</strong></div>)}</div></div></div></section>
    <section className="market-section market-section-cream"><div className="market-container market-form-section"><div><p className="market-eyebrow">PLAN A SESSION</p><h2>จัดอบรมให้เหมาะ<br />กับทีมของคุณ.</h2><p>แจ้งจำนวนผู้เข้าอบรม สถานที่ และช่วงเวลาที่ต้องการ ทีมงานจะช่วยสรุปขอบเขตและราคา</p></div><MiniLeadForm variant="training_redesign" theme="light" title="ฝากเบอร์เพื่อคุยเรื่องอบรม" /></div></section>
    <MarketLead title="พร้อมให้ทีมใช้ AED เป็น?" description="ส่งข้อมูลสถานที่และจำนวนผู้เข้าอบรม เพื่อรับรายละเอียดหลักสูตรและใบเสนอราคา" />
  </MarketPage>;
}
