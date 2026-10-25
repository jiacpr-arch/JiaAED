// What a JiaAED rental brings that a plain device rental doesn't — the group's
// own training centre, online courses and accessory shop (owner, 25 ต.ค. 2026).
// Pages and bots read these; tier quantities live in ./subscription.ts.

export const SISTER_SITES = {
  onlineCpr: { url: "https://cpr.morroo.com", label: "คอร์ส CPR & AED ออนไลน์", host: "cpr.morroo.com" },
  onlineFirstAid: { url: "https://firstaid.morroo.com", label: "คอร์สปฐมพยาบาลออนไลน์ (ฟรี)", host: "firstaid.morroo.com" },
  trainingCentre: { url: "https://www.jiacpr.com", label: "JIA TRAINER CENTER — อบรม CPR & AED", host: "jiacpr.com" },
  accessories: { url: "https://ads.jia1669.com/products#accessory", label: "ตู้และอุปกรณ์เสริม AED", host: "ads.jia1669.com" },
  airway: { url: "https://ads.jia1669.com/products#airway", label: "อุปกรณ์ปฐมพยาบาลและทางเดินหายใจ", host: "ads.jia1669.com" },
} as const;

/** "Rent with us" vs a plain device rental. Never names a competitor. */
export const rentalAdvantages: { item: string; jiaaed: string; plain: string }[] = [
  { item: "เครื่อง AED พร้อมแผ่นและแบตเตอรี่", jiaaed: "✓ Yuwell GPS", plain: "✓" },
  { item: "เปลี่ยนแบต/แผ่นตามอายุ + เครื่องสำรอง", jiaaed: "✓ ตลอดสัญญา", plain: "แล้วแต่ผู้ให้เช่า" },
  { item: "พนักงานเรียน CPR & AED ออนไลน์", jiaaed: "✓ 10 คน – ไม่จำกัด", plain: "—" },
  { item: "อบรมภาคปฏิบัติกับครูจริง", jiaaed: "✓ ศูนย์อบรมของเราเอง", plain: "—" },
  { item: "คอร์สปฐมพยาบาลออนไลน์", jiaaed: "✓ ฟรี 24 บทเรียน", plain: "—" },
  { item: "Pocket mask ติดเครื่อง + ตู้ ป้าย อุปกรณ์เสริม", jiaaed: "✓ มีครบในเครือ", plain: "—" },
];
