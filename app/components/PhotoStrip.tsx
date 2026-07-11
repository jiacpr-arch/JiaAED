import Image from "next/image";

export type PhotoStripItem = {
  src: string;
  alt: string;
  caption?: string;
};

// Real-photo grid used to break up text-heavy sections (pattern proven on
// /training). Captions overlay the bottom edge so the strip stays compact.
export function PhotoStrip({
  photos,
  cols = 3,
  heightClass = "h-56 md:h-64",
}: {
  photos: PhotoStripItem[];
  cols?: 2 | 3 | 4;
  heightClass?: string;
}) {
  const colsClass =
    cols === 2 ? "sm:grid-cols-2" : cols === 4 ? "sm:grid-cols-2 md:grid-cols-4" : "sm:grid-cols-2 md:grid-cols-3";

  return (
    <div className={`grid ${colsClass} gap-4`}>
      {photos.map((p) => (
        <div
          key={p.src}
          className={`relative w-full ${heightClass} rounded-2xl overflow-hidden border border-gray-800 bg-gray-900`}
        >
          <Image
            src={p.src}
            alt={p.alt}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
          {p.caption && (
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 pt-8 pb-2.5">
              <p className="text-white text-sm font-medium drop-shadow">{p.caption}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
