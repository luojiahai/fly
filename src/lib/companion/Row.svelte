<script lang="ts">
  import { getCompanion } from "./context";
  import { plain } from "./flight.svelte";
  import type { Item } from "./payload";
  import Rich from "./Rich.svelte";

  let { item, label, n }: { item: Item; label: string | null; n: number } = $props();

  const { flight, toggleTick } = getCompanion();
  const href = $derived(item.control.find((f) => f.t === "link")?.href);
  const ticked = $derived(!!flight.ticks[item.id]);

  function onclick(e: MouseEvent) {
    if (matchMedia("(pointer: coarse)").matches && (e.target as Element).closest("[data-tip]")) return;
    toggleTick(item.id);
  }
</script>

<!-- Space ticks a focused row through the page-wide key map, which also moves the cursor on. -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div class="line" class:next={flight.next?.id === item.id} data-id={item.id}><div class={["row", item.kind === "verify" && "verify", flight.cursor === item.id && "cursor"]} role="checkbox" tabindex="0" aria-checked={ticked} aria-labelledby="rn{n} ra{n}" aria-describedby={item.condition ? `rc${n}` : undefined} {onclick}><span class="box" aria-hidden="true"></span><span class="ctl"><span class="name" id="rn{n}"><Rich frag={item.control} presentational /></span>{#if item.full}<span class="full">{item.full}</span>{/if}</span><span class="act">{#if item.kind === "verify"}<span class="badge" aria-hidden="true">Verify</span>{/if}<span id="ra{n}"><Rich frag={item.action} presentational /></span></span>{#if item.condition}<span class="cond" id="rc{n}">{#if label && label !== "Condition"}<span class="cl">{label}</span>{" "}{/if}<Rich frag={item.condition} presentational /></span>{:else}<span class="cond"></span>{/if}</div>{#if href}<a class="doc" {href} target="_blank" rel="noopener" title="Open in the FlyByWire docs" aria-label="{plain(item.control)} in the FlyByWire docs">↗</a>{/if}</div>

<style>
  .line { position: relative; display: grid; grid-template-columns: minmax(0, 1fr) 36px; border-bottom: 1px solid var(--line); }
  .line.next { background: var(--tint); }
  .line.next::before {
    content: ""; position: absolute; left: -12px; top: 10px; bottom: 10px; width: 3px;
    border-radius: 1px; background: var(--action);
  }
  .row {
    display: grid; grid-template-columns: 28px minmax(0, 1fr) minmax(0, 1.15fr) minmax(0, .9fr);
    gap: 4px 14px; align-items: start; padding: 12px 4px; cursor: pointer;
    user-select: none; -webkit-tap-highlight-color: transparent;
  }
  .row:hover { background: color-mix(in srgb, var(--raised) 50%, transparent); }
  .row.cursor, .row:focus-visible { outline: 2px solid var(--action); outline-offset: -2px; }
  .box { width: 22px; height: 22px; display: grid; place-items: center; border: 2px solid var(--faint); border-radius: 2px; }
  [aria-checked="true"] > .box { background: var(--ok); border-color: var(--ok); }
  [aria-checked="true"] > .box::after {
    content: ""; width: 10px; height: 5px; border: solid var(--paper); border-width: 0 0 2.5px 2.5px;
    transform: translateY(-1px) rotate(-45deg);
  }
  .act :global(b) { color: var(--action); font-weight: 700; }
  .verify .act :global(b) { color: var(--ok); }
  .badge {
    display: inline-block; margin-right: 7px; padding: 1px 4px; vertical-align: 2px;
    border: 1px solid currentColor; border-radius: 2px; color: var(--ok);
    font: 700 10px/1.3 var(--ui); letter-spacing: .1em; text-transform: uppercase;
  }
  .cond { color: var(--muted); font-size: 13px; }
  .cl { display: block; color: var(--wait); font: 700 10px/1.5 var(--ui); letter-spacing: .1em; text-transform: uppercase; }
  .row[aria-checked="true"],
  .row[aria-checked="true"] .act :global(b),
  .row[aria-checked="true"] :is(.badge, .cond, .cl) { color: var(--faint); }
  .row[aria-checked="true"] .name { text-decoration: line-through; }
  .doc {
    display: grid; place-items: center; width: 32px; height: 32px; margin-top: 7px;
    border-radius: 2px; color: var(--faint); text-decoration: none;
  }
  .doc:hover { color: var(--action); background: var(--raised); }

  @container main (max-width: 640px) {
    .row { grid-template-columns: 26px minmax(0, 1fr); }
    .row > .box { grid-row: 1 / span 3; }
    .row > :not(.box) { grid-column: 2; }
    .cond:empty { display: none; }
    .cl { display: inline; margin-right: 6px; }
  }

  @media print {
    .doc { display: none !important; }
    [aria-checked="true"] > .box::after { border-color: #000; }
  }
</style>
