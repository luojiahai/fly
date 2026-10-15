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

<style>
  .switcher { grid-area: brand; position: relative; }
  .brand {
    display: flex; align-items: center; gap: 10px; padding: 0; cursor: pointer; text-align: left;
    border: 0; background: none;
  }
  .brand > :global(svg) { color: var(--muted); }
  .brand:hover > :global(svg), .brand[aria-expanded="true"] > :global(svg) { color: var(--ink); }
  .menu {
    position: absolute; top: calc(100% + 8px); left: 0; z-index: 30; min-width: 220px; margin: 0; padding: 4px;
    list-style: none; background: var(--surface); border: 1px solid var(--line); border-radius: 2px;
    box-shadow: 0 8px 24px var(--shadow);
  }
  .menu a {
    display: block; padding: 10px 12px; border-radius: 2px; text-decoration: none; color: var(--muted);
    font: 400 13px/1.2 var(--ui); letter-spacing: .08em; text-transform: uppercase;
  }
  .menu a:hover { color: var(--ink); background: var(--raised); }
  .menu a[aria-current] { color: var(--ink); box-shadow: inset 3px 0 0 var(--action); }
  .brand b { display: block; font: 400 13px/1.2 var(--ui); letter-spacing: .12em; text-transform: uppercase; white-space: nowrap; }
  .brand .dot { color: var(--faint); }
  .brand .ac { color: var(--muted); }
</style>
