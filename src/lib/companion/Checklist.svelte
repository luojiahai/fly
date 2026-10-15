<script lang="ts">
  import { getCompanion } from "./context";
  import Group from "./Group.svelte";

  let { main = $bindable() }: { main?: HTMLElement } = $props();

  const { flight, goToPhase } = getCompanion();
  const p = $derived(flight.current);
  const left = $derived(p.items.length - flight.done(p.items));
</script>

<!-- A lights chip with a full name takes focus so keyboard users can read its tooltip. -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<main id="main" bind:this={main}>{#key flight.phase}<h1 id="phase-title" tabindex="-1">{p.title}</h1>{#if p.lede}<p class="lede">{p.lede}</p>{/if}{#if p.lights.length}<div class="lights" role="group" aria-labelledby="lights-label"><span class="lbl" id="lights-label">Lights</span>{#each p.lights as entry, ei (ei)}{#if p.lights.length > 1}<span class="when">{entry.when}</span>{/if}{#each entry.set as s, si (si)}<span class="chip" tabindex={s.full ? 0 : undefined} data-tip={s.full ?? undefined}>{s.light} <b>{s.state}</b></span>{/each}{/each}</div>{/if}{#each p.groups as group, gi (gi)}<Group {group} {gi} />{/each}<div class={["endcard", !left && "ok"]} id="endcard"><span id="end-msg">{left ? `${left}${left === 1 ? " item" : " items"} left in ${p.short}` : `✓ ${p.short} complete`}</span>{#if flight.after}<button class={["bigbtn", !left && "go"]} id="end-next" onclick={() => goToPhase(flight.phase + 1)}>Next: {flight.after.num} · {flight.after.short} →</button>{:else}<span>End of flight</span>{/if}</div>{/key}<p class="credit">By <a href="https://luojiahai.com">luojiahai</a> · <a href="https://github.com/luojiahai/fly">Source</a> · Not affiliated with FlyByWire Simulations</p></main>
