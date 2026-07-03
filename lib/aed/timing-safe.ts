import { createHash, timingSafeEqual as nodeTimingSafeEqual } from "crypto";

/**
 * Constant-time string comparison that does not leak the length of either
 * input (both sides are hashed to fixed-size digests before comparing).
 */
export function timingSafeEqual(a: string, b: string): boolean {
  const da = createHash("sha256").update(a).digest();
  const db = createHash("sha256").update(b).digest();
  return nodeTimingSafeEqual(da, db);
}
