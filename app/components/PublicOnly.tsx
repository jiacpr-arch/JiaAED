"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

/** Renders customer-facing widgets (LINE bar, chat bubble) everywhere except /admin, where they covered the action buttons. */
export function PublicOnly({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;
  return <>{children}</>;
}
