import { error } from "@sveltejs/kit";
import { building } from "$app/environment";
import { aircraft } from "$lib/aircraft";
import { buildCompanion } from "$lib/server/companion";
import type { EntryGenerator, PageServerLoad } from "./$types";

const notes = import.meta.glob<string>("/aircraft/*/*.md", { query: "?raw", import: "default", eager: true });
const shared = import.meta.glob<string>("/shared/*.md", { query: "?raw", import: "default", eager: true });

const filesIn = (dir: string, glob: Record<string, string>) =>
  Object.fromEntries(
    Object.entries(glob)
      .filter(([path]) => path.startsWith(dir))
      .map(([path, text]) => [path.slice(dir.length), text]),
  );

export const entries: EntryGenerator = () => aircraft.map((entry) => ({ aircraft: entry.slug }));

export const load: PageServerLoad = ({ params }) => {
  const config = aircraft.find((entry) => entry.slug === params.aircraft);
  if (!config) error(404, "Unknown aircraft");
  const { payload, report } = buildCompanion(config, {
    own: filesIn(`/aircraft/${config.slug}/`, notes),
    shared: filesIn("/shared/", shared),
  });
  if (building) for (const line of report) console.log(`  ${config.slug}: ${line}`);
  return { slug: config.slug, name: config.name, payload };
};
