const STORAGE_KEY = "jiaaed_hero_variant";
const HEADLINE_KEY = "jiaaed_headline_variant";

export type HeroVariant = "a" | "b";
export type HeadlineVariant = "a" | "b";

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

export function getOrAssignHeadlineVariant(): HeadlineVariant {
  if (typeof window === "undefined") return "a";
  try {
    const existing = window.localStorage.getItem(HEADLINE_KEY);
    if (existing === "a" || existing === "b") return existing;
    const next: HeadlineVariant = Math.random() < 0.5 ? "a" : "b";
    window.localStorage.setItem(HEADLINE_KEY, next);
    return next;
  } catch {
    return "a";
  }
}

export function readHeadlineVariant(): HeadlineVariant | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(HEADLINE_KEY);
    return v === "a" || v === "b" ? v : null;
  } catch {
    return null;
  }
}
