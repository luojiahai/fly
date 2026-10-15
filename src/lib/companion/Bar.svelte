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
