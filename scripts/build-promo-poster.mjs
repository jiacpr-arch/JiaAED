// Build the AED Amoul i7 promo poster (full price ฿70,000 struck through → ฿39,999).
//
// Renders a self-contained SVG to PNG with @resvg/resvg-js using the Kanit /
// Sarabun Thai fonts in ./.fonts. Output: public/images/aed-i7-promo-39999.png
//
//   node scripts/build-promo-poster.mjs
//
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { Resvg } from "@resvg/resvg-js";

const ROOT = resolve(import.meta.dirname, "..");
const W = 1080;
const H = 1350;

// --- product photo, embedded as a data URI ---------------------------------
const productPng = readFileSync(join(ROOT, "public/images/product-main.png"));
const productDataUri = `data:image/png;base64,${productPng.toString("base64")}`;
// product-main.png is 690 x 470 (aspect ≈ 1.468)
const PROD_W = 690;
const PROD_H = 470;

// helper: escape text for XML
const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const svg = `
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#E11D2A"/>
      <stop offset="0.55" stop-color="#C30E1B"/>
      <stop offset="1" stop-color="#7A0710"/>
    </linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#FFE074"/>
      <stop offset="0.5" stop-color="#FFC72C"/>
      <stop offset="1" stop-color="#F4A100"/>
    </linearGradient>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="10" stdDeviation="18" flood-color="#000000" flood-opacity="0.35"/>
    </filter>
    <filter id="softsm" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#000000" flood-opacity="0.30"/>
    </filter>
  </defs>

  <!-- background -->
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <!-- faint diagonal sheen -->
  <polygon points="0,0 ${W},0 ${W},120 0,420" fill="#ffffff" opacity="0.06"/>
  <!-- big watermark heart bottom-right -->
  <g opacity="0.07" transform="translate(820,980) scale(7)">
    <path d="M12 21s-7.5-4.8-10-9.3C.3 8.4 2 5 5.2 5c2 0 3.3 1.1 4.1 2.2C10.2 6.1 11.5 5 13.5 5 16.7 5 18.4 8.4 16.7 11.7 14.2 16.2 12 21 12 21z" fill="#ffffff"/>
  </g>

  <!-- top badge pill -->
  <g filter="url(#softsm)">
    <rect x="300" y="58" width="480" height="62" rx="31" fill="#1f0405" opacity="0.92"/>
  </g>
  <text x="540" y="99" text-anchor="middle" font-family="Kanit SemiBold" font-size="28" fill="#FFD24A">อย. รับรอง · นำเข้าโดยตรง · ส่งฟรีทั่วประเทศ</text>

  <!-- title -->
  <text x="540" y="206" text-anchor="middle" font-family="Kanit ExtraBold" font-size="68" fill="#ffffff">เครื่องกระตุกหัวใจไฟฟ้า</text>
  <text x="540" y="284" text-anchor="middle" font-family="Kanit Black" font-size="74" fill="#FFC72C">อัตโนมัติ (AED)</text>
  <text x="540" y="344" text-anchor="middle" font-family="Kanit SemiBold" font-size="42" fill="#ffffff">รุ่น AED Amoul i7</text>

  <!-- corner discount ribbon -->
  <g transform="translate(1080,0) rotate(45)">
    <rect x="-250" y="104" width="500" height="74" fill="url(#gold)" filter="url(#softsm)"/>
    <rect x="-250" y="104" width="500" height="74" fill="none" stroke="#7A0710" stroke-width="3" opacity="0.45"/>
    <text x="0" y="155" text-anchor="middle" font-family="Kanit ExtraBold" font-size="38" fill="#7A0710">ลดมากกว่า 40%</text>
  </g>

  <!-- ===== PRICE PANEL ===== -->
  <g filter="url(#soft)">
    <rect x="96" y="392" width="888" height="286" rx="32" fill="url(#gold)"/>
  </g>
  <!-- full price (struck through) -->
  <text id="fullp" x="540" y="470" text-anchor="middle" font-family="Kanit SemiBold" font-size="46" fill="#7A0710">ราคาเต็ม 70,000 บาท</text>
  <!-- strike line over the full price -->
  <line x1="320" y1="455" x2="760" y2="455" stroke="#C30E1B" stroke-width="9" stroke-linecap="round"/>
  <!-- special label -->
  <text x="540" y="528" text-anchor="middle" font-family="Kanit SemiBold" font-size="34" fill="#5A0008">พิเศษสำหรับผู้สนใจ เพียง</text>
  <!-- big special price -->
  <text x="540" y="648" text-anchor="middle" font-family="Kanit Black" font-size="132" fill="#C30E1B">39,999<tspan font-size="60" dx="6" dy="-2"> บาท</tspan></text>

  <!-- ===== PRODUCT CARD ===== -->
  <g filter="url(#soft)">
    <rect x="190" y="712" width="700" height="372" rx="28" fill="#ffffff"/>
  </g>
  <image href="${productDataUri}" x="245" y="730" width="590" height="${(590 * PROD_H) / PROD_W}" preserveAspectRatio="xMidYMid meet"/>

  <!-- feature chips -->
  ${[
    "Shock 7 วินาที",
    "เสียงไทย",
    "IP65 กันน้ำ",
    "อย. รับรอง",
  ]
    .map((t, i) => {
      const widths = [232, 150, 210, 178];
      const gap = 18;
      const total = widths.reduce((a, b) => a + b, 0) + gap * (widths.length - 1);
      let x = (W - total) / 2;
      for (let k = 0; k < i; k++) x += widths[k] + gap;
      const w = widths[i];
      const cx = x + w / 2;
      return `<g><rect x="${x}" y="1118" width="${w}" height="58" rx="29" fill="#ffffff" opacity="0.14"/><rect x="${x}" y="1118" width="${w}" height="58" rx="29" fill="none" stroke="#FFC72C" stroke-width="2" opacity="0.7"/><text x="${cx}" y="1156" text-anchor="middle" font-family="Kanit Medium" font-size="28" fill="#ffffff">✓ ${esc(
        t
      )}</text></g>`;
    })
    .join("\n  ")}

  <!-- footer brand bar -->
  <rect x="0" y="1244" width="${W}" height="106" fill="#1f0405" opacity="0.55"/>
  <text x="60" y="1296" font-family="Kanit Black" font-size="44" fill="#FFC72C">JiaAED</text>
  <text x="60" y="1330" font-family="Sarabun" font-size="24" fill="#ffffff">เจี่ยรักษา · นำเข้าโดยตรง</text>
  <text x="${W - 60}" y="1290" text-anchor="end" font-family="Kanit SemiBold" font-size="30" fill="#ffffff">LINE: @273fzpzs</text>
  <text x="${W - 60}" y="1326" text-anchor="end" font-family="Sarabun" font-size="22" fill="#FFD24A">อย. 68-2-2-2-0005243 · ฆพ.743/2569</text>
</svg>`;

const resvg = new Resvg(svg, {
  background: "transparent",
  fitTo: { mode: "width", value: W },
  font: {
    fontDirs: [join(ROOT, ".fonts")],
    loadSystemFonts: true,
    defaultFontFamily: "Kanit",
  },
});
const png = resvg.render().asPng();
const out = join(ROOT, "public/images/aed-i7-promo-39999.png");
writeFileSync(out, png);
console.log(`wrote ${out} (${png.length} bytes)`);
console.log("fonts dir:", readdirSync(join(ROOT, ".fonts")).join(", "));
