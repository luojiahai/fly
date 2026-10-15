import { readdirSync, readFileSync } from "node:fs";
import { aircraft } from "../src/lib/aircraft.ts";
import { buildCompanion } from "../src/lib/server/companion.ts";

const dir = (path: string) =>
  Object.fromEntries(
    readdirSync(new URL(path, import.meta.url))
      .filter((file) => file.endsWith(".md"))
      .map((file) => [file, readFileSync(new URL(path + file, import.meta.url), "utf8")]),
  );

const slug = process.argv[2];
const config = aircraft.find((entry) => entry.slug === slug);
if (!config) {
  console.error(`usage: pnpm payload <${aircraft.map((entry) => entry.slug).join("|")}>`);
  process.exit(1);
}

const { payload, report } = buildCompanion(config, { own: dir(`../aircraft/${slug}/`), shared: dir("../shared/") });
for (const line of report) console.error(line);
console.log(JSON.stringify(payload));
