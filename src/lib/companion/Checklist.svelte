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

<style>
  main { grid-column: 2; grid-row: 2; min-width: 0; padding: 22px 28px 40px; container: main / inline-size; }
  main > :global(*) { max-width: 1100px; }
  h1 { margin: 0 0 6px; font: 700 22px/1.2 var(--mono); letter-spacing: .03em; text-transform: uppercase; }
  .lede { margin: 0 0 14px; max-width: 66ch; color: var(--muted); }

  .lights {
    display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin: 12px 0 8px; padding: 10px 12px;
    background: var(--surface); border: 1px solid var(--line); border-radius: 2px;
  }
  .lights .lbl { margin-right: 4px; color: var(--muted); font: 700 11px var(--ui); letter-spacing: .12em; text-transform: uppercase; }
  .lights .when { margin: 0 2px 0 8px; color: var(--muted); font-size: 12px; }
  .chip {
    display: inline-flex; align-items: baseline; gap: 6px; padding: 3px 8px; white-space: nowrap;
    border: 1px solid var(--line); border-radius: 2px; font-size: 13px;
  }
  .chip b { color: var(--action); font-weight: 700; }
  .chip[data-tip] { cursor: help; }

  .endcard {
    display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px;
    margin-top: 28px; padding: 16px; border: 1px dashed var(--line); border-radius: 2px; color: var(--muted);
  }
  .endcard.ok { border-style: solid; border-color: var(--ok); color: var(--ink); }

  .credit { margin: 20px 0 0; color: var(--faint); font-size: 12px; }
  .credit a { color: var(--muted); }

  @media (max-width: 1020px) {
    main { grid-column: 1; grid-row: 3; padding: 16px 16px 32px; }
  }

  @media print {
    main { padding: 0; }
  }
</style>
