// ─── Trust signals & related regulations ──────────────────────────────────────
// Headline credibility numbers + a note on Thai laws/standards relevant to AED.

export const trustStats: { value: string; label: string }[] = [
  { value: "500+", label: "เครื่อง AED ที่ดูแล" },
  { value: "15+", label: "ปีประสบการณ์" },
  { value: "400", label: "องค์กรลูกค้า" },
  { value: "100,000+", label: "คนที่ได้รับการดูแล" },
];

export const trustedBy =
  "องค์กรกว่า 100 แห่งเลือกใช้บริการดูแล AED กับ JIA CPR";

// Related regulations / standards note ("กฎหมายที่เกี่ยวข้อง").
export const relatedRegulations: { title: string; detail: string }[] = [
  {
    title: "เครื่องมือแพทย์ต้องขึ้นทะเบียน อย.",
    detail:
      "เครื่อง AED จัดเป็นเครื่องมือแพทย์ที่ต้องขึ้นทะเบียนกับสำนักงานคณะกรรมการอาหารและยา (อย.) และการโฆษณาต้องมีใบอนุญาตโฆษณาเครื่องมือแพทย์ (ฆพ.)",
  },
  {
    title: "มาตรฐานสากลของตัวเครื่อง",
    detail:
      "เลือกเครื่องที่ผ่านมาตรฐานสากล เช่น CE, ISO 13485 และแนวทาง CPR/AED ตาม ILCOR/AHA ฉบับล่าสุด เพื่อความปลอดภัยและประสิทธิภาพในการช่วยชีวิต",
  },
  {
    title: "การติดตั้งในที่สาธารณะ",
    detail:
      "หน่วยงานหลายแห่งสนับสนุนให้ติดตั้ง AED ในจุดที่หยิบใช้ได้ภายใน 3–4 นาที พร้อมป้ายบอกตำแหน่งที่ชัดเจน — ทีมงานให้คำแนะนำการเลือกจุดติดตั้งและป้ายตามมาตรฐาน",
  },
];
