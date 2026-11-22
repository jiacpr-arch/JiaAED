"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

/** Renders customer-facing widgets (LINE bar, chat bubble) everywhere except /admin (they covered the action buttons) and iframe embeds. */
export function PublicOnly({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;
  // Inside a jia1669.com iframe the floating bar/bubble would sit over the
  // frame's content mid-page; the embed has its own LINE and phone CTAs.
  if (pathname?.endsWith("/embed")) return null;
  return <>{children}</>;
}
