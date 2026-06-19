// ─── AED + GPS bundle & Cloud Monitoring Dashboard ────────────────────────────
// GPS (Yuwell GPS) is bundled with the managed-rental tiers (see ./subscription.ts).
// It is positioned as an asset/team-tracking + readiness system, not just a tag.

export const gpsImage = "/images/aed-gps-tracking.png"; // real Yuwell/PRIMEDIC GPS tracking visual

export const gpsFeatures: { icon: string; title: string; desc: string }[] = [
  {
    icon: "📍",
    title: "ระบุตำแหน่ง AED แบบเรียลไทม์",
    desc: "เห็นพิกัดเครื่องบนแผนที่ทันที — เหมาะกับองค์กรหลายสาขาและทีมงานนอกสถานที่",
  },
  {
    icon: "🚑",
    title: "ติดตามยานพาหนะ/ทีมฉุกเฉิน",
    desc: "ติดตามรถพยาบาลของบริษัทหรือทีมนอกสถานที่ เพื่อส่งความช่วยเหลือได้เร็วขึ้นในวิกฤต",
  },
  {
    icon: "🛡️",
    title: "บริหารทรัพย์สินขององค์กร",
    desc: "ลดการสูญหาย ติดตามทรัพย์สินมูลค่าสูง เพิ่มความปลอดภัยรอบด้าน",
  },
  {
    icon: "🔔",
    title: "แจ้งเตือนเมื่อมีการเปิดตู้ AED",
    desc: "รับการแจ้งเตือนเมื่อมีการนำเครื่องออกใช้หรืออุปกรณ์มีปัญหา",
  },
];

// Cloud Monitoring Dashboard — readiness at a glance across all locations.
export const dashboardImage = "/images/cloud-dashboard.png"; // real Yuwell Cloud Monitoring Dashboard visual

export const dashboardFeatures: string[] = [
  "ดูสถานะเครื่องหลายจุดในหน้าจอเดียว (Multi-location)",
  "ตรวจสอบสถานะแบตเตอรี่และแผ่น Pad แบบออนไลน์",
  "ระบบแจ้งเตือนอัตโนมัติเมื่ออุปกรณ์ใกล้หมดอายุ",
  "ตรวจสอบผล Self-test ของเครื่องได้ตลอดเวลา",
  "ลดความเสี่ยงเครื่องไม่พร้อมใช้งานในภาวะฉุกเฉิน",
  "มั่นใจว่าเครื่องพร้อมใช้งานตลอด 24 ชั่วโมง",
];
