export const load = <T>(key: string, fallback: T): T => {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "null") ?? fallback;
  } catch {
    return fallback;
  }
};

export const save = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
};

export const KEYS = {
  aircraft: "fly.aircraft.v1",
  mode: "fly.mode.v1",
  scheme: "fly.scheme.v1",
  ticks: (slug: string) => `fly.${slug}.ticks.v2`,
  fields: (slug: string) => `fly.${slug}.fields.v1`,
  phase: (slug: string) => `fly.${slug}.phase.v1`,
};
