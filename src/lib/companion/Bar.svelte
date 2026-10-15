<script lang="ts">
  import { tick } from "svelte";
  import { getCompanion } from "./context";
  import { plain } from "./flight.svelte";

  let { bar = $bindable() }: { bar?: HTMLElement } = $props();

  const { flight, goToPhase, tickNext } = getCompanion();
  let tickButton = $state<HTMLButtonElement>();
  let goButton = $state<HTMLButtonElement>();

  $effect.pre(() => {
    if (flight.next || document.activeElement !== tickButton) return;
    tick().then(() => (goButton?.hidden ? document.getElementById("phase-title") : goButton)?.focus({ preventScroll: true }));
  });
</script>

<div class="bar" id="bar" bind:this={bar}>
  <p id="next-label">{#if flight.next}Next: <b>{plain(flight.next.control)}</b> — {plain(flight.next.action)}{:else}✓ {flight.current.short} complete{flight.after ? "" : " · end of flight"}{/if}</p>
  <span class="keys" aria-hidden="true">
    <span><kbd>J</kbd> <kbd>K</kbd> move</span>
    <span><kbd>Space</kbd> tick</span>
    <span><kbd>1</kbd>–<kbd>9</kbd> phase</span>
    <span><kbd>L</kbd> <kbd>R</kbd> <kbd>A</kbd> reference</span>
    <span><kbd>Esc</kbd> close</span>
  </span>
  <button class="bigbtn go" id="tick-next" hidden={!flight.next} onclick={tickNext} bind:this={tickButton}>✓ Tick</button>
  <button class="bigbtn go" id="next-phase" hidden={!!flight.next || !flight.after} onclick={() => goToPhase(flight.phase + 1)} bind:this={goButton}>Next phase →</button>
</div>

<style>
  .bar {
    grid-column: 2; grid-row: 3; position: sticky; bottom: 0; z-index: 15;
    display: flex; flex-wrap: wrap; align-items: center; gap: 8px 14px;
    padding: 10px 16px calc(10px + env(safe-area-inset-bottom));
    background: var(--paper); border-top: 1px solid var(--line);
  }
  #next-label {
    flex: 1 1 220px; min-width: 0; margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    color: var(--muted); font-size: 13px;
  }
  #next-label b { color: var(--ink); }
  .keys { order: 3; display: flex; flex-wrap: wrap; gap: 4px 14px; color: var(--muted); font-size: 11px; white-space: nowrap; }
  @media (pointer: coarse) { .keys { display: none; } }

  @media (max-width: 1020px) {
    .bar { grid-column: 1; grid-row: 4; }
  }

  @media print {
    .bar { display: none !important; }
  }
</style>
