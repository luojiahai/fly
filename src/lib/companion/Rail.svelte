<script lang="ts">
  import { getCompanion } from "./context";

  let { rail = $bindable() }: { rail?: HTMLElement } = $props();

  const { flight, goToPhase } = getCompanion();
</script>

<nav class="rail" id="rail" aria-label="Flight phases" bind:this={rail}>{#each flight.phases as p, i (p.id)}{@const c = flight.done(p.items)}{@const complete = c === p.items.length}<button class={[complete && "done"]} aria-current={i === flight.phase ? "step" : undefined} aria-keyshortcuts={String(i + 1)} onclick={() => goToPhase(i)}><span class="n">{p.num}</span><span class="t">{p.short}</span><span class="pc">{complete ? "✓" : `${c}/${p.items.length}`}</span></button>{/each}</nav>

<style>
  .rail {
    grid-column: 1; grid-row: 2 / 4; align-self: start;
    position: sticky; top: var(--header-h, 61px); max-height: calc(100dvh - var(--header-h, 61px));
    overflow-y: auto; padding: 14px 10px; border-right: 1px solid var(--line);
  }
  .rail button {
    display: grid; grid-template-columns: 20px minmax(0, 1fr) auto; gap: 8px; align-items: center;
    width: 100%; min-height: 48px; padding: 8px; cursor: pointer; text-align: left;
    border: 0; border-radius: 2px; background: none; color: var(--muted); font: 400 14px/1.25 var(--ui);
  }
  .rail button:hover { color: var(--ink); background: color-mix(in srgb, var(--raised) 60%, transparent); }
  .rail .n, .rail .pc { color: var(--faint); font: 400 12px var(--mono); font-variant-numeric: tabular-nums; }
  .rail .done .pc { color: var(--ok); }
  .rail [aria-current] { background: var(--raised); color: var(--ink); box-shadow: inset 3px 0 0 var(--action); }
  .rail [aria-current] .n { color: var(--action); }

  @media (max-width: 1020px) {
    .rail {
      grid-row: 2; z-index: 12; max-height: none; display: flex; gap: 2px; padding: 4px 10px;
      overflow-x: auto; scrollbar-width: none; border-right: 0; border-bottom: 1px solid var(--line); background: var(--paper);
    }
    .rail::-webkit-scrollbar { display: none; }
    .rail button { flex: none; display: inline-flex; width: auto; min-height: 44px; padding: 0 12px; white-space: nowrap; }
    .rail .pc { display: none; }
    .rail .done .pc { display: inline; }
    .rail [aria-current] { box-shadow: inset 0 -3px 0 var(--action); }
  }

  @media print {
    .rail { display: none !important; }
  }
</style>
