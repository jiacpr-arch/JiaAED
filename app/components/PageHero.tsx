import Image from "next/image";
import { MarketHero } from "./MarketShell";

// Shared hero for inner pages — docs/news/articles used to hand-roll this
// gradient banner while about/training/quote had none, so inner pages opened
// with three different looks. One component, three layouts:
//   - plain gradient (articles)
//   - gradient + product/side image on the right (docs)
//   - gradient + faded full-bleed background photo (news)
export function PageHero({
  badge,
  title,
  subtitle,
  image,
  imageAlt = "",
  backgroundImage,
  chips,
  children,
}: {
  badge?: string;
  title: string;
  subtitle?: string;
  /** Side image shown in a white card on the right (desktop only). */
  image?: string;
  imageAlt?: string;
  /** Full-bleed photo faded behind the gradient. */
  backgroundImage?: string;
  /** Short trust markers rendered as pills under the subtitle. */
  chips?: string[];
  children?: React.ReactNode;
}) {
  return (
    <MarketHero eyebrow={badge ?? "JiaAED"} title={title} description={subtitle ?? ""} image={backgroundImage}>
      {chips && <div className="market-hero-chips">{chips.map((c) => <span key={c}>✓ {c}</span>)}</div>}
      {image && <Image src={image} alt={imageAlt} width={480} height={480} className="market-hero-side-photo" />}
      {children}
    </MarketHero>
  );
}
