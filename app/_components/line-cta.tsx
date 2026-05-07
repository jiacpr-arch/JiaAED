"use client";

import type { ReactNode } from "react";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
  }
}

interface Props {
  href: string;
  className?: string;
  source: string; // e.g. "hero", "product_i7", "footer"
  productId?: string;
  value?: number;
  children: ReactNode;
}

/**
 * LINE OA CTA button. On click, fires:
 * - Meta Pixel "Lead" event (with custom_data.source)
 * - Google gtag "generate_lead" event
 * Then navigates to LINE.
 */
export function LineCta({ href, className, source, productId, value, children }: Props) {
  const handleClick = () => {
    try {
      window.fbq?.("track", "Lead", {
        source,
        content_ids: productId ? [productId] : undefined,
        value,
        currency: value ? "THB" : undefined,
      });
      window.gtag?.("event", "generate_lead", {
        source,
        item_id: productId,
        value,
        currency: value ? "THB" : undefined,
      });
    } catch {
      // ignore tracking errors
    }
  };

  return (
    <a href={href} className={className} target="_blank" rel="noopener noreferrer" onClick={handleClick}>
      {children}
    </a>
  );
}
