// ─── Certified instructor / BLS training ──────────────────────────────────────
// Training is included in the packages and managed-rental tiers. Instructors are
// certified through the BLS Instructor Course at วิทยาลัยแพทยศาสตร์พระมงกุฎเกล้า.

export const trainingImages = [
  "/images/training-bls-1.jpg", // real photo: CPR + AED hands-on (อบรมกระทรวงยุติธรรม)
  "/images/training-bls-2.jpg", // real photo: BLS Instructor course group + certificates (PMC 2026)
  "/images/training-bls-3.jpg", // real photo: first-aid practice session (เบรดี้ ประเทศไทย)
];

export const instructorCredential = {
  title: "วิทยากรผู้สอนที่ผ่านการรับรองอย่างเป็นทางการ",
  course: "Basic Life Support Instructor Course for Healthcare Provider",
  issuer: "ศูนย์สถานการณ์จำลองทางการแพทย์ทหาร วิทยาลัยแพทยศาสตร์พระมงกุฎเกล้า",
  points: [
    "ผ่านการอบรม Instructor อย่างเป็นทางการ",
    "มีใบประกาศรับรอง และการรับรองยังไม่หมดอายุ",
    "ประสบการณ์สอนทั้งภาครัฐและเอกชน",
    "สอน CPR + การใช้ AED ควบคู่กัน เพิ่มความมั่นใจให้ทีมงาน",
  ],
};

export const trainingValueProps: { icon: string; title: string; desc: string }[] = [
  {
    icon: "🎓",
    title: "อบรมการใช้งานจริง",
    desc: "ลดความตื่นตระหนก เพิ่มความมั่นใจเมื่อเกิดเหตุฉุกเฉิน",
  },
  {
    icon: "❤️",
    title: "CPR + AED ควบคู่กัน",
    desc: "เทคนิคปฐมพยาบาลพื้นฐานที่ช่วยเพิ่มโอกาสรอดชีวิตอย่างมีนัยสำคัญ",
  },
  {
    icon: "🏅",
    title: "ผู้สอนผ่าน Instructor Course",
    desc: "มาตรฐานเดียวกับที่ใช้ฝึกบุคลากรทางการแพทย์",
  },
];
