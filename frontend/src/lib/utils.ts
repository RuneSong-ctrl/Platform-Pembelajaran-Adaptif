import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const LEVEL_LABELS: Record<string, string> = {
  BASIC: "Pemula", MEDIUM: "Menengah", CHALLENGING: "Mahir", MASTERY: "Ahli",
};

/** Student-facing name for a DDA level code; unknown codes pass through. */
export function levelLabel(level?: string | null, fallback = "BASIC"): string {
  const code = level || fallback;
  return LEVEL_LABELS[code] ?? code;
}
