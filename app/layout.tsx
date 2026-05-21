import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { GoogleTags } from "./components/GoogleTags";
import { LineClickTracker } from "./components/LineClickTracker";
import { StructuredData } from "./components/StructuredData";
import { WebChat } from "./components/WebChat";
import { FloatingLineButton } from "./components/FloatingLineButton";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://jiaaed.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "JiaAED — AED Amoul i7 เครื่องกระตุกหัวใจไฟฟ้า อย. รับรอง",
    template: "%s · JiaAED",
  },
  description:
    "AED Amoul i7 เครื่องกระตุกหัวใจไฟฟ้าอัตโนมัติ Shock พร้อมใน 7 วินาที เสียงแนะนำภาษาไทย IP65 กันน้ำ ทะเบียน อย. 68-2-2-2-0005243 · ฆพ.743/2569 · รับประกัน 1 ปี",
  keywords: [
    "AED",
    "เครื่องกระตุกหัวใจ",
    "Amoul i7",
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
    title: "JiaAED — AED Amoul i7 เครื่องกระตุกหัวใจไฟฟ้า",
    description:
      "Shock พร้อมใน 7 วินาที · เสียงแนะนำภาษาไทย · IP65 กันน้ำ · อย. รับรอง · รับประกัน 1 ปี",
    images: [
      {
        url: "/images/aed-poster.jpg",
        width: 1200,
        height: 630,
        alt: "AED Amoul i7",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "JiaAED — AED Amoul i7",
    description:
      "เครื่องกระตุกหัวใจไฟฟ้าอัตโนมัติ Shock 7 วินาที · เสียงไทย · IP65",
    images: ["/images/aed-poster.jpg"],
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
        <GoogleTags />
        <StructuredData />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <LineClickTracker />
        {children}
        <WebChat />
        <FloatingLineButton />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
