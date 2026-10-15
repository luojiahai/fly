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
