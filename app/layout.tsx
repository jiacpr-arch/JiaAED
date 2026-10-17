import type { Metadata } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import "./market.css";
import { CookieConsent } from "./components/CookieConsent";
import { LineClickTracker } from "./components/LineClickTracker";
import { StructuredData } from "./components/StructuredData";
import { WebChat } from "./components/WebChat";
import { FloatingLineButton } from "./components/FloatingLineButton";
import { MobileContactBar } from "./components/MobileContactBar";
import { ScrollDepthTracker } from "./components/ScrollDepthTracker";
import { PRIMEDIC_REGULATORY } from "@/lib/aed/regulatory";

// Thai body font — the previous Arial fallback rendered Thai text cramped and
// was a big reason the site felt like a wall of text. Its "latin" subset also
// covers English, so no second (Geist) font is preloaded on every page.
const notoSansThai = Noto_Sans_Thai({
  variable: "--font-noto-thai",
  subsets: ["thai", "latin"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://jiaaed.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    // ~60 chars — longer titles get truncated in Google results
    default: "JiaAED — เครื่องกระตุกหัวใจไฟฟ้า AED ขายและให้เช่า · อย. รับรอง",
    template: "%s · JiaAED",
  },
  description:
    "เครื่องกระตุกหัวใจไฟฟ้า (AED) Yuwell / PRIMEDIC HeartSave — Y0, Y8, Y2 (เรือธง จอสี EKG) พร้อม Yuwell AED รุ่นมี GPS ในตัว · เสียงแนะนำภาษาไทย" +
    (PRIMEDIC_REGULATORY.published && PRIMEDIC_REGULATORY.fda ? ` · ทะเบียน อย. ${PRIMEDIC_REGULATORY.fda}` : ""),
  keywords: [
    "AED",
    "เครื่องกระตุกหัวใจ",
    "Yuwell Y2",
    "PRIMEDIC HeartSave",
    "PRIMEDIC Y0",
    "PRIMEDIC Y8",
    "Yuwell AED GPS",
    "AED ราคา",
    "เครื่อง AED",
    "Defibrillator",
    "JiaAED",
    "เจี่ยรักษา",
  ],
  authors: [{ name: "JiaAED by เจี่ยรักษา" }],
  openGraph: {
    type: "website",
    locale: "th_TH",
    url: SITE_URL,
    siteName: "JiaAED",
    title: "JiaAED — AED Yuwell Y2 และ PRIMEDIC HeartSave",
    description:
      "เครื่องกระตุกหัวใจไฟฟ้า Yuwell / PRIMEDIC HeartSave ให้เลือกหลายรุ่น · เสียงแนะนำภาษาไทย · อย. รับรอง",
    images: [
      {
        // 1200x630 banner made for link previews — the portrait product shot
        // that used to sit here got cropped to nothing in LINE/Facebook cards.
        url: "/images/og-cover.png",
        width: 1200,
        height: 630,
        alt: "JiaAED — เครื่องกระตุกหัวใจไฟฟ้า AED ขาย ให้เช่า อบรม CPR",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "JiaAED — AED Yuwell Y2 และ PRIMEDIC HeartSave",
    description:
      "เครื่องกระตุกหัวใจไฟฟ้า Yuwell / PRIMEDIC HeartSave · เสียงไทย · อย. รับรอง",
    images: ["/images/og-cover.png"],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <head>
        <StructuredData />
      </head>
      <body
        className={`${notoSansThai.variable} antialiased`}
      >
        {/* PDPA: trackers (gtag / Meta Pixel / PostHog) live behind the consent gate */}
        <CookieConsent />
        <LineClickTracker />
        <ScrollDepthTracker />
        {children}
        <MobileContactBar />
        <WebChat />
        <FloatingLineButton />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
