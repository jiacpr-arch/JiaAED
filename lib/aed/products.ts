export type Product = {
  id: string;
  name: string;
  subtitle: string;
  price: number;
  msrp: number;
  description: string;
  features: string[];
  badge: string | null;
};

export const products: Product[] = [
  {
    id: "i7",
    name: "AED Amoul i7",
    subtitle: "รุ่นมาตรฐาน",
    price: 39999,
    msrp: 70000,
    description: "เหมาะสำหรับสำนักงาน โรงเรียน และสถานที่ทั่วไป",
    features: [
      "น้ำหนัก ~ 2 กก. (รวมแบตเตอรี่)",
      "เสียงแนะนำ 5 ภาษา (TH/EN/CN/ES/IT)",
      "Escalating 100-360J ผู้ใหญ่ · 10-100J เด็ก",
      "Standalone — ไม่ต้องเชื่อมต่อก็ใช้งานได้",
      "รับประกัน 1 ปี",
    ],
    badge: null,
  },
  {
    id: "i7-cabinet",
    name: "AED Amoul i7 + ตู้",
    subtitle: "รุ่นพร้อมตู้ติดผนัง",
    price: 44999,
    msrp: 80000,
    description: "ครบชุด พร้อมตู้ติดผนังและสัญญาณเตือน",
    features: [
      "ครบชุดพร้อมติดตั้ง",
      "ตู้กันฝุ่นกันน้ำ IP65",
      "สัญญาณเตือนเปิดตู้",
      "รับประกัน 1 ปี",
    ],
    badge: "ยอดนิยม",
  },
  {
    id: "i7-floor",
    name: "AED Amoul i7 + แท่นตั้งพื้น",
    subtitle: "รุ่นแท่นตั้งพื้น",
    price: 49000,
    msrp: 90000,
    description: "เคลื่อนย้ายได้ เหมาะสำหรับสถานที่ขนาดใหญ่",
    features: [
      "เคลื่อนย้ายได้สะดวก",
      "แท่นตั้งพื้นมั่นคง",
      "มองเห็นได้ชัด",
      "รับประกัน 1 ปี",
    ],
    badge: null,
  },
];
