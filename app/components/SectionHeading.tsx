// Section title in the homepage's editorial voice: a quiet eyebrow line
// instead of a pill badge, then a large, lighter-weight headline.
export function SectionHeading({
  badge,
  title,
  subtitle,
  align = "center",
  as: Tag = "h2",
}: {
  badge?: string;
  title: string;
  subtitle?: string;
  align?: "center" | "left";
  /** Use "h1" for the page's first heading so every page has exactly one h1. */
  as?: "h1" | "h2";
}) {
  const centered = align === "center";
  return (
    <div className={centered ? "text-center" : "text-left"}>
      {badge && (
        <p className="text-yellow-400 text-xs md:text-sm font-semibold tracking-wide mb-3">{badge}</p>
      )}
      <Tag
        className={`${
          Tag === "h1" ? "text-4xl md:text-6xl" : "text-3xl md:text-5xl"
        } font-semibold text-white leading-[1.12] tracking-[-0.02em] text-balance`}
      >
        {title}
      </Tag>
      {subtitle && (
        <p className={`text-gray-400 mt-4 max-w-2xl text-base md:text-lg leading-relaxed ${centered ? "mx-auto" : ""}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
