<script lang="ts">
  import BookOpen from "@lucide/svelte/icons/book-open";
  import Contrast from "@lucide/svelte/icons/contrast";
  import Lightbulb from "@lucide/svelte/icons/lightbulb";
  import Moon from "@lucide/svelte/icons/moon";
  import Radio from "@lucide/svelte/icons/radio";
  import RotateCcw from "@lucide/svelte/icons/rotate-ccw";
  import Sun from "@lucide/svelte/icons/sun";
  import { getCompanion } from "./context";
  import { cycleScheme, prefs, SCHEMES, setMode } from "./prefs.svelte";
  import Switcher from "./Switcher.svelte";

  let { header = $bindable() }: { header?: HTMLElement } = $props();

  const { flight, toggleRef, reset } = getCompanion();
  const tools = [
    { id: "lights", label: "Lights", short: "Lights", key: "L", Icon: Lightbulb },
    { id: "atc", label: "Radio", short: "Radio", key: "R", Icon: Radio },
    { id: "abbreviations", label: "Abbreviations", short: "Abbrev.", key: "A", Icon: BookOpen },
  ] as const;
  const schemeIcons = { auto: Contrast, dark: Moon, light: Sun };
  const SchemeIcon = $derived(schemeIcons[prefs.scheme]);
  const scheme = $derived(SCHEMES[prefs.scheme].label);
  const ticked = $derived(flight.phases.reduce((sum, p) => sum + flight.done(p.items), 0));
  const total = flight.phases.reduce((sum, p) => sum + p.items.length, 0);
</script>

<header bind:this={header}>
  <Switcher />
  <div class="prog">
    <div class="segs" id="segs" aria-hidden="true">{#each flight.phases as p, i (p.id)}<i style="flex-grow:{p.items.length};--p:{p.items.length ? (flight.done(p.items) / p.items.length) * 100 : 0}%" class={i === flight.phase ? "cur" : undefined}></i>{/each}</div>
    <span class="total" id="total">{ticked} / {total}</span>
  </div>
  <div class="tools">
    <div class="seg" role="group" aria-label="Detail">
      <button aria-pressed={prefs.mode === "fly"} title="Steps only, notes on demand" onclick={() => setMode("fly")}>Fly</button>
      <button aria-pressed={prefs.mode === "learn"} title="Every note and explanation" onclick={() => setMode("learn")}>Learn</button>
    </div>
    {#each tools as tool (tool.id)}
      <button class="hbtn" data-ref={tool.id} aria-label={tool.label} aria-controls="ref" aria-expanded={flight.ref === tool.id} aria-keyshortcuts={tool.key} title="{tool.label} ({tool.key})" onclick={() => toggleRef(tool.id)}>
        <tool.Icon aria-hidden="true" />
        <span class="lbl">{tool.short}</span>
      </button>
    {/each}
  </div>
  <div class="util">
    <button class="hbtn" id="scheme" aria-label="Colour scheme: {scheme}" title="Colour scheme: {scheme} (Auto, Dark, Light)" onclick={cycleScheme}><SchemeIcon aria-hidden="true" /><span class="lbl">{scheme}</span></button>
    <button class="hbtn" aria-label="Reset flight" title="Reset flight" onclick={reset}>
      <RotateCcw aria-hidden="true" />
      <span class="lbl">Reset</span>
    </button>
  </div>
</header>

<style>
  header {
    grid-column: 1 / -1; grid-row: 1; position: sticky; top: 0; z-index: 20;
    display: grid; grid-template-columns: auto minmax(0, 1fr) auto auto;
    grid-template-areas: "brand prog tools util";
    align-items: center; gap: 10px 16px; padding: 10px 16px;
    background: var(--paper); border-bottom: 1px solid var(--line);
  }

  .prog { grid-area: prog; display: flex; align-items: center; gap: 12px; min-width: 0; }
  .segs { flex: 1; display: flex; gap: 3px; height: 8px; min-width: 0; }
  .segs i { flex: 1 1 0; min-width: 2px; border-radius: 1px; background: linear-gradient(90deg, var(--ok) var(--p), var(--raised) 0); }
  .segs i.cur { outline: 1.5px solid var(--action); outline-offset: 2px; }
  .total { color: var(--muted); font-size: 12px; font-variant-numeric: tabular-nums; white-space: nowrap; }

  .tools, .util { display: flex; align-items: center; gap: 6px; }
  .tools { grid-area: tools; }
  .util { grid-area: util; }
  .seg { display: inline-flex; padding: 2px; border: 1px solid var(--line); border-radius: 2px; background: var(--surface); }
  .seg button {
    min-height: 34px; padding: 0 12px; border: 0; border-radius: 2px; background: none; cursor: pointer;
    color: var(--muted); font: 700 12px/1 var(--ui); letter-spacing: .08em; text-transform: uppercase;
  }
  .seg button[aria-pressed="true"] { background: var(--ink); color: var(--paper); }

  @media (max-width: 1020px) {
    header { grid-template-columns: auto minmax(0, 1fr) auto; grid-template-areas: "brand tools util" "prog prog prog"; }
    .tools { justify-self: end; }
    .hbtn .lbl { display: none; }
    .total { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
  }

  @media (max-width: 720px) {
    header {
      grid-template-columns: minmax(0, 1fr) auto auto; grid-template-areas: "brand brand util" "tools tools tools" "prog prog prog";
      padding: 8px 12px;
    }
    .util { justify-self: end; }
    .tools { justify-self: start; }
  }

  @media print {
    header { display: none !important; }
  }
</style>
