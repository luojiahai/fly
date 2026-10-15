<script lang="ts">
  import X from "@lucide/svelte/icons/x";
  import { getCompanion } from "./context";
  import { REFS } from "./flight.svelte";
  import Matrix from "./Matrix.svelte";
  import type { ExchangeBlock, Group, MatrixBlock, ProseBlock, RefId } from "./payload";
  import Prose from "./Prose.svelte";

  let { panel = $bindable() }: { panel?: HTMLElement } = $props();

  const { flight, openRef, closeRef } = getCompanion();
  let lastSheet = $state<RefId | null>(null);
  $effect.pre(() => {
    if (flight.ref) lastSheet = flight.ref;
  });
  const sheet = $derived(lastSheet ? flight.payload.refs[lastSheet] : null);
  const query = $derived(flight.filter.trim().toLowerCase());

  const say = (text: string) => text.split(/\{([A-Z0-9 _+]+)\}/);

  const matchCount = (g: Group<MatrixBlock | ProseBlock>) =>
    g.blocks.reduce(
      (n, b) => n + (b.type === "matrix" ? b.rows.filter((r) => !query || r.join("").toLowerCase().includes(query)).length : 0),
      0,
    );
  const anyMatch = $derived(flight.payload.refs.abbreviations.groups.some((g) => matchCount(g) > 0));

  $effect(() => {
    if (lastSheet && panel) panel.scrollTop = 0;
  });
</script>

{#snippet exchange(b: ExchangeBlock)}
  <div class="ex">{#if b.title}<h4>{b.title}</h4>{/if}{#each b.turns as t, ti (ti)}<div class="turn {t.who === 'You' ? 'you' : 'atc'}"><span class="who">{t.who}{#if t.tag}<small>{t.tag}</small>{/if}</span><span class="say">{#each say(t.text) as part, pi (pi)}{#if pi % 2}{@const v = (flight.fields[part] || "").trim()}{#if v}<span class="fill">{v}</span>{:else}<span class="tok">{part.toLowerCase()}</span>{/if}{:else}{part}{/if}{/each}</span></div>{/each}</div>
{/snippet}

<aside class="ref" id="ref" aria-label="Reference" hidden={!flight.ref}>
  <div class="ref-head">
    <div class="ref-tabs" id="ref-tabs" role="tablist" aria-label="Reference sheets">
      {#each REFS as r (r.id)}
        <button role="tab" id="tab-{r.id}" aria-controls="ref-panel" aria-selected={r.id === flight.ref} tabindex={r.id === flight.ref ? 0 : -1} aria-keyshortcuts={r.key.toUpperCase()} onclick={() => openRef(r.id)}>{r.label}</button>
      {/each}
    </div>
    <button class="hbtn" aria-label="Close reference" title="Close (Esc)" onclick={closeRef}><X aria-hidden="true" /></button>
  </div>
  <div id="ref-panel" role="tabpanel" tabindex="0" aria-labelledby={flight.ref ? `tab-${flight.ref}` : undefined} bind:this={panel}>
    {#if sheet}
      <h2>{sheet.title}</h2>
      {#if lastSheet === "lights"}
        {#each flight.payload.refs.lights.groups as g, gi (gi)}<section>{#if g.title}<h3>{g.title}</h3>{/if}{#each g.blocks as b, bi (bi)}{#if b.type === "matrix"}<Matrix block={b} highlight={flight.current.lights.map((e) => e.when)} lights />{:else}<div class="prose"><Prose block={b} /></div>{/if}{/each}</section>{/each}
      {:else if lastSheet === "atc"}
        {@const atc = flight.payload.refs.atc}
        {#if atc.chain}<p class="chain">{#each atc.chain as c, ci (ci)}{#if ci}<span aria-hidden="true">→</span>{/if}<b>{c}</b>{/each}</p>{/if}
        <div class="fields">{#each flight.payload.tokens as t (t.key)}<label>{t.label}<input value={flight.fields[t.key] || ""} placeholder={t.key.toLowerCase()} autocomplete="off" autocapitalize="characters" spellcheck="false" oninput={(e) => flight.setField(t.key, e.currentTarget.value)} /></label>{/each}</div>
        {#each atc.groups as g, gi (gi)}<section>{#if g.title}<h3>{g.title}</h3>{/if}{#each g.blocks as b, bi (bi)}{#if b.type === "exchange"}{@render exchange(b)}{:else}<div class="prose"><Prose block={b} /></div>{/if}{/each}</section>{/each}
      {:else}
        <input class="filter" id="ref-filter" type="search" bind:value={flight.filter} placeholder="Filter, e.g. FMA" aria-label="Filter abbreviations" autocomplete="off" autocapitalize="characters" spellcheck="false" />
        {#each flight.payload.refs.abbreviations.groups as g, gi (gi)}<section hidden={matchCount(g) === 0}>{#if g.title}<h3>{g.title}</h3>{/if}{#each g.blocks as b, bi (bi)}{#if b.type === "matrix"}<Matrix block={b} filter={query} />{:else}<div class="prose"><Prose block={b} /></div>{/if}{/each}</section>{/each}
        <p class="empty" id="ref-empty" hidden={anyMatch}>Nothing matches “{flight.filter.trim()}”</p>
      {/if}
    {/if}
  </div>
</aside>

<style>
  .ref {
    grid-column: 3; grid-row: 2 / 4; align-self: start;
    position: sticky; top: var(--header-h, 61px); height: calc(100dvh - var(--header-h, 61px));
    display: flex; flex-direction: column; width: min(460px, 38vw);
    background: var(--surface); border-left: 1px solid var(--line);
  }
  .ref-head { display: flex; align-items: center; gap: 6px; padding: 8px 10px; border-bottom: 1px solid var(--line); }
  .ref-tabs { display: flex; gap: 4px; flex: 1; min-width: 0; overflow-x: auto; }
  [role="tab"] {
    min-height: 36px; padding: 0 10px; cursor: pointer; white-space: nowrap;
    border: 0; border-radius: 2px; background: none;
    color: var(--muted); font: 700 12px/1 var(--ui); letter-spacing: .06em; text-transform: uppercase;
  }
  [role="tab"][aria-selected="true"] { background: var(--raised); color: var(--ink); box-shadow: inset 0 -2px 0 var(--action); }
  #ref-panel { flex: 1; overflow-y: auto; overscroll-behavior: contain; padding: 14px 16px 40px; font-size: 13px; }
  #ref-panel h2 { margin: 0 0 12px; font: 700 15px/1.3 var(--mono); letter-spacing: .03em; text-transform: uppercase; }
  #ref-panel h3 { margin: 18px 0 8px; color: var(--muted); font: 700 11px var(--ui); letter-spacing: .12em; text-transform: uppercase; }

  .filter, .fields input {
    width: 100%; min-width: 0; padding: 7px 8px; border: 1px solid var(--line); border-radius: 2px;
    background: var(--paper); color: var(--ink); font: 400 14px var(--mono); letter-spacing: 0; text-transform: none;
  }
  .filter { margin-bottom: 8px; }
  input::placeholder { color: var(--faint); }
  input:focus-visible { outline-offset: 0; }
  .empty { color: var(--muted); }
  .fields { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 8px; margin-bottom: 16px; }
  .fields label { display: grid; gap: 4px; color: var(--muted); font: 400 11px var(--ui); letter-spacing: .06em; text-transform: uppercase; }
  .chain { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin: 0 0 14px; color: var(--muted); font-size: 12px; }
  .chain b { padding: 2px 7px; border: 1px solid var(--line); border-radius: 2px; color: var(--ink); font-weight: 400; }
  .ex { margin: 0 0 10px; padding: 10px; border: 1px solid var(--line); border-radius: 2px; }
  .ex h4 { margin: 0 0 6px; font: 700 12px var(--ui); }
  .turn { display: grid; grid-template-columns: 64px minmax(0, 1fr); gap: 8px; padding: 3px 0; }
  .who { color: var(--muted); font: 700 10px/1.8 var(--ui); letter-spacing: .1em; text-transform: uppercase; }
  .who small { display: block; font-weight: 400; line-height: 1.2; letter-spacing: 0; text-transform: none; }
  .you .who { color: var(--action); }
  .atc .say { color: var(--muted); }
  .fill { color: var(--action); font-weight: 700; }
  .tok { color: var(--faint); border-bottom: 1px dashed currentColor; }

  @media (max-width: 1020px) {
    .ref {
      position: fixed; inset: auto 0 0; z-index: 40; width: auto; height: 72dvh;
      border-left: 0; border-top: 1px solid var(--line); border-radius: 12px 12px 0 0;
      box-shadow: 0 -20px 60px var(--shadow);
    }
    @media (prefers-reduced-motion: no-preference) {
      .ref { animation: rise .22s cubic-bezier(.16, 1, .3, 1); }
    }
  }
  @keyframes rise { from { transform: translateY(32px); opacity: 0; } }

  @media (max-width: 720px) {
    .turn { grid-template-columns: 1fr; gap: 2px; }
    .who small { display: inline; margin-left: 6px; }
    /* Under 16px iOS Safari zooms in on focus and never zooms back out. */
    .filter, .fields input { font-size: 16px; }
  }

  @media print {
    .ref { display: none !important; }
  }
</style>
