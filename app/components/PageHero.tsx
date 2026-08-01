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
    <section className="relative overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-yellow-950 py-12 md:py-14 px-4">
      {backgroundImage && (
        <div className="absolute inset-0 opacity-15">
          <Image src={backgroundImage} alt="" fill className="object-cover object-center" />
        </div>
      )}
      <div
        className={`relative max-w-6xl mx-auto ${
          image ? "grid md:grid-cols-[1fr_240px] gap-8 items-center" : ""
        }`}
      >
        <div>
          {badge && (
            <div className="inline-block bg-yellow-400/10 text-yellow-400 text-xs font-semibold px-3 py-1 rounded-full mb-4 border border-yellow-400/20">
              {badge}
            </div>
          )}
          <h1 className="text-3xl md:text-4xl font-black mb-3 leading-tight">{title}</h1>
          {subtitle && <p className="text-gray-400 max-w-2xl">{subtitle}</p>}
          {chips && chips.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-5">
              {chips.map((c) => (
                <span
                  key={c}
                  className="bg-white/5 text-gray-300 text-xs font-semibold px-3 py-1.5 rounded-full border border-gray-700"
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
