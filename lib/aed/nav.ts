// Single source of truth for site-wide navigation. SiteHeader, SiteFooter and
// the homepage footer all render from these lists, so adding a page here makes
// it reachable from every corner of the site at once — no more per-file link
// lists drifting out of sync (which is how /aed/yuwell-y2 ended up orphaned).

export type NavLink = { href: string; label: string };
export type NavGroup = { title: string; links: NavLink[] };

// Desktop/mobile header nav — short labels, buyer-first order.
export const HEADER_LINKS: NavLink[] = [
  { href: "/aed/packages", label: "แพ็กเกจ" },
  { href: "/aed/subscription", label: "เช่า AED" },
  { href: "/aed/rental", label: "เช่า & เช่าซื้อ" },
  { href: "/aed/yuwell-y2", label: "Yuwell Y2" },
  { href: "/aed/primedic", label: "PRIMEDIC" },
  { href: "/training", label: "อบรม" },
  { href: "/about", label: "เกี่ยวกับเรา" },
];

// Footer sitemap — every public page, grouped so the footer doubles as a
// site map. Labels are longer/descriptive here than in the header.
export const FOOTER_GROUPS: NavGroup[] = [
  {
    title: "สินค้า AED",
    links: [
      { href: "/aed/yuwell-y2", label: "Yuwell Y2 (เรือธง จอ EKG)" },
      { href: "/aed/primedic", label: "PRIMEDIC HeartSave" },
      { href: "/aed/packages", label: "แพ็กเกจ AED + GPS" },
    ],
  },
  {
    title: "บริการ",
    links: [
      { href: "/aed/subscription", label: "เช่า AED รายเดือน" },
      { href: "/aed/rental", label: "เช่า & เช่าซื้อ (Rent-to-Own)" },
      { href: "/training", label: "อบรม CPR / AED" },
      { href: "/quote", label: "ขอใบเสนอราคา" },
    ],
  },
  {
    title: "ข้อมูล",
    links: [
      { href: "/docs", label: "เอกสารดาวน์โหลด" },
      { href: "/articles", label: "บทความ" },
      { href: "/news", label: "ข่าว" },
      { href: "/about", label: "เกี่ยวกับเรา" },
      { href: "/privacy", label: "นโยบายความเป็นส่วนตัว" },
    ],
  },
];

// Flat list for compact footers (e.g. the homepage's centered footer).
export const FOOTER_LINKS: NavLink[] = FOOTER_GROUPS.flatMap((g) => g.links);
