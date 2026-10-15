/** No value imports, so scripts/payload.ts can load it on plain Node. */
export type AircraftConfig = {
  slug: string;
  name: string;
  railTitles: Record<string, string>;
  phaseLightColumns: Record<string, readonly string[]>;
  aliases: Record<string, string>;
};

export const aircraft = [
  {
    slug: "fbw-a32nx",
    name: "FlyByWire A32NX",
    railTitles: {
      "6-descent-planning-and-descent": "Descent",
      "7-approach-and-ils-landing": "Approach and Landing",
    },
    phaseLightColumns: {
      "2-starting-the-aircraft": ["Prep"],
      "4-engine-start-and-taxi": ["Start and Taxi"],
      "5-takeoff-climb-and-cruise": ["Takeoff", "Initial Climb", "Above 10,000 ft"],
      "6-descent-planning-and-descent": ["Descent 10,000 ft"],
      "7-approach-and-ils-landing": ["Final (G/S green)"],
      "8-after-landing-and-taxi-to-gate": ["After Landing"],
      "9-powering-down": ["Shutdown"],
    },
    aliases: { PERF: "APPROACH" },
  },
  {
    slug: "fbw-a380x",
    name: "FlyByWire A380X",
    railTitles: {},
    phaseLightColumns: {
      "2-cockpit-preparation": ["Prep"],
      "4-engine-start-and-taxi": ["Start and Taxi"],
      "5-takeoff-climb-and-cruise": ["Takeoff", "Initial Climb", "Above 10,000 ft"],
      "6-descent": ["Descent 10,000 ft"],
      "7-landing": ["Final (G/S green)"],
      "8-after-landing-and-taxi-to-gate": ["After Landing"],
      "9-powering-down": ["Shutdown"],
    },
    aliases: {},
  },
] as const satisfies readonly AircraftConfig[];

export type Aircraft = (typeof aircraft)[number];
export type AircraftSlug = Aircraft["slug"];

export const DEFAULT_AIRCRAFT: AircraftSlug = "fbw-a32nx";

export const isAircraftSlug = (value: unknown): value is AircraftSlug =>
  aircraft.some((entry) => entry.slug === value);
