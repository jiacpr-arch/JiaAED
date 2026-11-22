import type { Metadata } from "next";
import { Y8_GPS_LANDING_PATH } from "@/lib/aed/y8-gps-landing";
import { Y8GpsLandingContent } from "../LandingContent";
import { EmbedBridge } from "./EmbedBridge";

export const revalidate = 3600;

// Framed on www.jia1669.com only (CSP frame-ancestors in next.config.ts). Never
// indexed: the content is the same as the main landing page.
export const metadata: Metadata = {
  title: "เช่า AED HeartSave Y8 GPS",
  alternates: { canonical: Y8_GPS_LANDING_PATH },
  robots: { index: false, follow: false },
};

export default function HeartSaveY8GpsEmbed() {
  return (
    <div className="market" data-embed="y8gps">
      <main id="main">
        <Y8GpsLandingContent embedded />
      </main>
      <EmbedBridge />
    </div>
  );
}
