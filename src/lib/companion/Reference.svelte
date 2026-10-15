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
