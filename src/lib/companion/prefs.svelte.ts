import { KEYS, load, save } from "./storage";

export const SCHEMES = {
  auto: { next: "dark", label: "Auto", panel: null },
  dark: { next: "light", label: "Dark", panel: "#132128" },
  light: { next: "auto", label: "Light", panel: "#b7c9d3" },
} as const;
export type Scheme = keyof typeof SCHEMES;

export const MODES = ["fly", "learn"] as const;
export type Mode = (typeof MODES)[number];

const pick = <T extends string>(value: unknown, allowed: readonly T[], fallback: T): T =>
  allowed.includes(value as T) ? (value as T) : fallback;

export const prefs = $state({ scheme: "auto" as Scheme, mode: "fly" as Mode });

export function restorePrefs() {
  prefs.scheme = pick(load(KEYS.scheme, "auto"), Object.keys(SCHEMES) as Scheme[], "auto");
  prefs.mode = pick(load(KEYS.mode, "fly"), MODES, "fly");
}

export function cycleScheme() {
  prefs.scheme = SCHEMES[prefs.scheme].next;
  save(KEYS.scheme, prefs.scheme);
}

export function setMode(mode: Mode) {
  prefs.mode = mode;
  save(KEYS.mode, mode);
}
