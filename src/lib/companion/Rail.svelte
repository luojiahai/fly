<script lang="ts">
  import { getCompanion } from "./context";

  let { rail = $bindable() }: { rail?: HTMLElement } = $props();

  const { flight, goToPhase } = getCompanion();
</script>

<nav class="rail" id="rail" aria-label="Flight phases" bind:this={rail}>{#each flight.phases as p, i (p.id)}{@const c = flight.done(p.items)}{@const complete = c === p.items.length}<button class={[complete && "done"]} aria-current={i === flight.phase ? "step" : undefined} aria-keyshortcuts={String(i + 1)} onclick={() => goToPhase(i)}><span class="n">{p.num}</span><span class="t">{p.short}</span><span class="pc">{complete ? "✓" : `${c}/${p.items.length}`}</span></button>{/each}</nav>
