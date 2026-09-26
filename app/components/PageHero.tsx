import Image from "next/image";

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
    <section className="page-hero relative overflow-hidden bg-gray-950 py-16 md:py-24 px-4">
      {backgroundImage && (
        <div className="absolute inset-0 opacity-30">
          <Image src={backgroundImage} alt="" fill className="object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-950/85 to-gray-950/40" />
        </div>
      )}
      <div
        className={`relative max-w-6xl mx-auto ${
          image ? "grid md:grid-cols-[1fr_240px] gap-8 items-center" : ""
        }`}
      >
        <div>
          {badge && <p className="text-yellow-400 text-xs md:text-sm font-semibold tracking-wide mb-4">{badge}</p>}
          <h1 className="text-4xl md:text-6xl font-semibold mb-5 leading-[1.12] tracking-[-0.02em] text-balance max-w-4xl">
            {title}
          </h1>
          {subtitle && <p className="text-gray-300 max-w-2xl text-base md:text-lg leading-relaxed">{subtitle}</p>}
          {chips && chips.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-5">
              {chips.map((c) => (
                <span
                  key={c}
                  className="text-gray-300 text-xs md:text-sm px-3 py-1.5 rounded-full border border-white/15"
                >
                  ✓ {c}
                </span>
              ))}
            </div>
          )}
          {children}
        </div>
        {image && (
          <div className="hidden md:block rounded-2xl overflow-hidden border border-gray-800 bg-white">
            <Image src={image} alt={imageAlt} width={480} height={480} className="w-full h-auto" />
          </div>
        )}
      </div>
    </section>
  );
}
