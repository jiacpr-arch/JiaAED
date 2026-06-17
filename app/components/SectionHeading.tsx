export function SectionHeading({
  badge,
  title,
  subtitle,
  align = "center",
}: {
  badge?: string;
  title: string;
  subtitle?: string;
  align?: "center" | "left";
}) {
  return (
    <div className={align === "center" ? "text-center" : "text-left"}>
      {badge && (
        <div
          className={`inline-block bg-yellow-400/10 text-yellow-400 text-xs font-semibold px-3 py-1 rounded-full mb-3 border border-yellow-400/20 ${
            align === "center" ? "" : ""
          }`}
        >
          {badge}
        </div>
      )}
      <h2 className="text-2xl md:text-3xl font-black text-white leading-tight">{title}</h2>
      {subtitle && <p className="text-gray-400 mt-2 max-w-2xl mx-auto">{subtitle}</p>}
    </div>
  );
}
