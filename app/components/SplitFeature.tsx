import Image from "next/image";
import type { ReactNode } from "react";

// Image + short-copy split (pattern proven by the homepage IP65 section).
// Use to replace paragraph/list walls with a photo and a few scannable bullets.
export function SplitFeature({
  image,
  imageAlt,
  badge,
  title,
  intro,
  bullets,
  bulletTone = "yellow",
  reverse = false,
  children,
}: {
  image: string;
  imageAlt: string;
  badge?: string;
  title: ReactNode;
  intro?: string;
  bullets?: string[];
  bulletTone?: "yellow" | "red" | "green";
  reverse?: boolean;
  children?: ReactNode;
}) {
  const mark = bulletTone === "red" ? "✗" : "✓";
  const markColor =
    bulletTone === "red" ? "text-red-400" : bulletTone === "green" ? "text-green-400" : "text-yellow-400";

  return (
    <div className="grid md:grid-cols-2 gap-8 items-center">
      <div
        className={`rounded-2xl overflow-hidden shadow-2xl border border-gray-800 ${reverse ? "md:order-2" : ""}`}
      >
        <Image src={image} alt={imageAlt} width={600} height={400} className="w-full h-auto" />
      </div>
      <div className={reverse ? "md:order-1" : ""}>
        {badge && (
          <div className="inline-block bg-yellow-400/10 text-yellow-400 text-xs font-bold px-3 py-1 rounded-full mb-3 border border-yellow-400/20">
            {badge}
          </div>
        )}
        <h2 className="text-3xl font-black mb-4 text-white">{title}</h2>
        {intro && <p className="text-gray-400 mb-5">{intro}</p>}
        {bullets && bullets.length > 0 && (
          <ul className="space-y-3">
            {bullets.map((f) => (
              <li key={f} className="flex items-start gap-3 text-gray-300">
                <span className={`${markColor} font-bold text-lg flex-shrink-0 leading-6`}>{mark}</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
        )}
        {children}
      </div>
    </div>
  );
}
