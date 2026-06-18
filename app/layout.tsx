import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { GoogleTags } from "./components/GoogleTags";
import { MetaPixel } from "./components/MetaPixel";
import { LineClickTracker } from "./components/LineClickTracker";
import { StructuredData } from "./components/StructuredData";
import { WebChat } from "./components/WebChat";
import { FloatingLineButton } from "./components/FloatingLineButton";
import { ScrollDepthTracker } from "./components/ScrollDepthTracker";
import { PostHogInit } from "./components/PostHogInit";

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
    default: "JiaAED — AED Amoul i7 และ PRIMEDIC HeartSave เครื่องกระตุกหัวใจไฟฟ้า อย. รับรอง",
    template: "%s · JiaAED",
  },
  description:
    "เครื่องกระตุกหัวใจไฟฟ้า (AED) 2 แบรนด์ให้เลือก — Amoul i7 และ PRIMEDIC HeartSave (Y0/Y8) พร้อม Yuwell AED รุ่นมี GPS ในตัว · เสียงแนะนำภาษาไทย · ทะเบียน อย. 68-2-2-2-0005243 · ฆพ.743/2569",
  keywords: [
    "AED",
    "เครื่องกระตุกหัวใจ",
    "Amoul i7",
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
    title: "JiaAED — AED Amoul i7 และ PRIMEDIC HeartSave",
    description:
      "เครื่องกระตุกหัวใจไฟฟ้า 2 แบรนด์ให้เลือก · เสียงแนะนำภาษาไทย · อย. รับรอง",
    images: [
      {
        url: "/images/aed-i7-poster.jpg",
        width: 1179,
        height: 1651,
        alt: "AED Amoul i7 เครื่องกระตุกหัวใจไฟฟ้า",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "JiaAED — AED Amoul i7 และ PRIMEDIC HeartSave",
    description:
      "เครื่องกระตุกหัวใจไฟฟ้า 2 แบรนด์ · เสียงไทย · อย. รับรอง",
    images: ["/images/aed-i7-poster.jpg"],
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
        <MetaPixel />
        <StructuredData />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <PostHogInit />
        <LineClickTracker />
        <ScrollDepthTracker />
        {children}
        <WebChat />
        <FloatingLineButton />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
