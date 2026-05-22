"use client";

import { useState } from "react";
import Image from "next/image";

type Props = {
  videoId: string;
  title: string;
  className?: string;
};

export function YouTubeLite({ videoId, title, className = "" }: Props) {
  const [activated, setActivated] = useState(false);

  return (
    <div
      className={`relative w-full aspect-video overflow-hidden rounded-2xl bg-black shadow-2xl border border-gray-700 ${className}`}
    >
      {activated ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      ) : (
        <button
          type="button"
          onClick={() => setActivated(true)}
          aria-label={`เล่นวิดีโอ: ${title}`}
          className="group absolute inset-0 w-full h-full cursor-pointer"
        >
          <Image
            src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, 800px"
            className="object-cover"
            unoptimized
          />
          <span className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors" />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex items-center justify-center w-20 h-20 rounded-full bg-red-600 group-hover:bg-red-500 shadow-2xl transition-colors">
              <svg viewBox="0 0 24 24" className="w-9 h-9 ml-1 fill-white" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </span>
        </button>
      )}
    </div>
  );
}
