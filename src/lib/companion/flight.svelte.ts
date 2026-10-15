import { SvelteSet } from "svelte/reactivity";
import type { Frag, Item, Payload, Phase, RefId } from "./payload";
import { KEYS, load, save } from "./storage";

export const REFS = [
  { id: "lights", key: "l", label: "Lights" },
  { id: "atc", key: "r", label: "Radio" },
  { id: "abbreviations", key: "a", label: "Abbreviations" },
] as const satisfies readonly { id: RefId; key: string; label: string }[];

export type ChecklistGroup = Phase["groups"][number] & { items: Item[] };
export type PhaseView = Omit<Phase, "groups"> & { groups: ChecklistGroup[]; items: Item[] };

export const plain = (frag: Frag | null) => (frag ?? []).map((n) => n.v).join("");

export class Flight {
  readonly slug: string;
  readonly name: string;
  readonly payload: Payload;
  readonly phases: PhaseView[];

  phase = $state(0);
  ticks: Record<string, true> = $state({});
  fields: Record<string, string> = $state({});
  ref: RefId | null = $state(null);
  cursor: string | null = $state(null);
  filter = $state("");
  menu = $state(false);
  live = $state("");
  readonly open = new SvelteSet<string>();

  readonly current = $derived.by(() => this.phases[this.phase]);
  readonly after = $derived.by(() => this.phases[this.phase + 1]);
  readonly next = $derived.by(() => this.current.items.find((i) => !this.ticks[i.id]));

  constructor(slug: string, name: string, payload: Payload) {
    this.slug = slug;
    this.name = name;
    this.payload = payload;
    this.phases = payload.phases.map((p) => {
      const groups = p.groups.map((g) => ({
        ...g,
        items: g.blocks.flatMap((b) => (b.type === "items" ? b.items : [])),
      }));
      return { ...p, groups, items: groups.flatMap((g) => g.items) };
    });
  }

  done = (items: Item[]) => items.filter((i) => this.ticks[i.id]).length;

  phaseFromHash = () => this.phases.findIndex((p) => p.id === decodeURIComponent(location.hash.slice(1)));

  restore() {
    this.ticks = load(KEYS.ticks(this.slug), {});
    this.fields = load(KEYS.fields(this.slug), {});
    const fromHash = this.phaseFromHash();
    const saved = this.phases.findIndex((p) => p.id === load(KEYS.phase(this.slug), ""));
    this.setPhase(fromHash >= 0 ? fromHash : Math.max(0, saved));
    save(KEYS.aircraft, this.slug);
  }

  setPhase(i: number) {
    this.phase = i;
    this.cursor = null;
    save(KEYS.phase(this.slug), this.phases[i].id);
  }

  setTick(id: string, on: boolean) {
    if (on) this.ticks[id] = true;
    else delete this.ticks[id];
    save(KEYS.ticks(this.slug), this.ticks);
    const p = this.current;
    this.live = `${p.short} ${this.done(p.items)} of ${p.items.length}`;
  }

  setField(key: string, value: string) {
    this.fields[key] = value;
    save(KEYS.fields(this.slug), this.fields);
  }

  reset(): () => void {
    const before = { ticks: $state.snapshot(this.ticks), fields: $state.snapshot(this.fields) };
    this.replace({}, {});
    return () => this.replace(before.ticks, before.fields);
  }

  private replace(ticks: Record<string, true>, fields: Record<string, string>) {
    this.ticks = ticks;
    this.fields = fields;
    save(KEYS.ticks(this.slug), ticks);
    save(KEYS.fields(this.slug), fields);
  }

  syncFromOtherTab(key: string | null) {
    if (key === KEYS.ticks(this.slug)) this.ticks = load(key, {});
    if (key === KEYS.fields(this.slug)) this.fields = load(key, {});
  }
}
