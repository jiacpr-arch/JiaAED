const STORAGE_KEY = "jiaaed_hero_variant";

export type HeroVariant = "a" | "b";

export function getOrAssignHeroVariant(): HeroVariant {
  if (typeof window === "undefined") return "a";
  try {
    const existing = window.localStorage.getItem(STORAGE_KEY);
    if (existing === "a" || existing === "b") return existing;
    const next: HeroVariant = Math.random() < 0.5 ? "a" : "b";
    window.localStorage.setItem(STORAGE_KEY, next);
    return next;
  } catch {
    return "a";
  }
}

export function readHeroVariant(): HeroVariant | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === "a" || v === "b" ? v : null;
  } catch {
    return null;
  }
}
