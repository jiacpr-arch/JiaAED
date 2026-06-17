import Link from "next/link";

const LINE_OA = "https://line.me/R/ti/p/@273fzpzs";

export function SiteFooter({
  fda = "68-2-2-2-0005243",
  adLicense = "743/2569",
  regNote,
}: {
  fda?: string;
  adLicense?: string;
  // Override the whole registration line (e.g. PRIMEDIC pending disclaimer).
  regNote?: string;
}) {
  return (
    <footer className="border-t border-gray-800 bg-gray-950">
      <div className="max-w-6xl mx-auto px-4 py-10 text-sm text-gray-400">
        <div className="flex flex-wrap gap-x-6 gap-y-2 mb-4">
          <Link href="/aed/packages" className="hover:text-yellow-400">แพ็กเกจ AED</Link>
          <Link href="/aed/subscription" className="hover:text-yellow-400">เช่า AED รายเดือน</Link>
          <Link href="/aed/primedic" className="hover:text-yellow-400">PRIMEDIC HeartSave</Link>
          <Link href="/aed/rental" className="hover:text-yellow-400">เช่าระยะสั้น</Link>
          <Link href="/training" className="hover:text-yellow-400">อบรม CPR/AED</Link>
          <Link href="/about" className="hover:text-yellow-400">เกี่ยวกับเรา</Link>
          <Link href="/docs" className="hover:text-yellow-400">เอกสาร</Link>
          <Link href="/articles" className="hover:text-yellow-400">บทความ</Link>
        </div>
        <p className="text-xs text-gray-500">
          {regNote ?? `เจี่ยรักษา (JiaAED) — นำเข้าและจัดจำหน่ายเครื่องมือแพทย์โดยตรง · ทะเบียน อย. ${fda} · ฆพ.${adLicense}`}
        </p>
        <p className="text-xs text-gray-600 mt-2">
          © {new Date().getFullYear()} JiaAED ·{" "}
          <a href={LINE_OA} target="_blank" rel="noopener noreferrer" data-line-cta="footer" className="hover:text-yellow-400">
            ติดต่อทาง LINE @273fzpzs
          </a>
        </p>
      </div>
    </footer>
  );
}
