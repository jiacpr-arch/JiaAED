"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { initPostHog, capturePageview } from "@/lib/aed/posthog-client";

// useSearchParams must sit inside a Suspense boundary in the App Router,
// otherwise it opts the whole tree out of static rendering.
function PostHogTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    initPostHog(); // idempotent — guarantees init before the first pageview
    capturePageview();
  }, [pathname, searchParams]);

  return null;
}

export function PostHogInit() {
  return (
    <Suspense fallback={null}>
      <PostHogTracker />
    </Suspense>
  );
}
