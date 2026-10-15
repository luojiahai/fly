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
