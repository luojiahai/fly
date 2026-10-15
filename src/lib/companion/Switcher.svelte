<script lang="ts">
  import ChevronDown from "@lucide/svelte/icons/chevron-down";
  import { preloadData } from "$app/navigation";
  import { aircraft } from "$lib/aircraft";
  import { getCompanion } from "./context";

  const { flight } = getCompanion();
  let root = $state<HTMLElement>();

  function toggle() {
    flight.menu = !flight.menu;
    if (flight.menu) for (const entry of aircraft) if (entry.slug !== flight.slug) preloadData(`/${entry.slug}`);
  }
</script>

<svelte:document onclick={(e) => flight.menu && !root?.contains(e.target as Node) && (flight.menu = false)} />

<div class="switcher" bind:this={root}>
  <button class="brand" aria-expanded={flight.menu} aria-controls="aircraft-menu" aria-label="{flight.name}, switch aircraft" onclick={toggle}>
    <b>Fly <span class="dot">·</span> <span class="ac">{flight.name}</span></b>
    <ChevronDown />
  </button>
  {#if flight.menu}
    <ul class="menu" id="aircraft-menu">
      {#each aircraft as entry (entry.slug)}
        <li><a href="/{entry.slug}" onclick={(e) => { if (entry.slug === flight.slug) e.preventDefault(); flight.menu = false; }} aria-current={entry.slug === flight.slug ? "page" : undefined}>{entry.name}</a></li>
      {/each}
    </ul>
  {/if}
</div>
