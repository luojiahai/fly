<script lang="ts">
  import { getCompanion } from "./context";
  import type { ChecklistGroup } from "./flight.svelte";
  import type { ItemsBlock, ProseBlock } from "./payload";
  import Prose from "./Prose.svelte";
  import Row from "./Row.svelte";

  let { group, gi }: { group: ChecklistGroup; gi: number } = $props();

  const { flight } = getCompanion();

  type Run = { kind: "prose"; id: string; blocks: ProseBlock[] } | { kind: "rows"; block: ItemsBlock };

  const runs = $derived.by(() => {
    const out: Run[] = [];
    let proseRuns = 0;
    for (const block of group.blocks) {
      const last = out.at(-1);
      if (block.type === "items") out.push({ kind: "rows", block });
      else if (last?.kind === "prose") last.blocks.push(block);
      else out.push({ kind: "prose", id: `prose-${gi}-${proseRuns++}`, blocks: [block] });
    }
    return out;
  });
  const proseIds = $derived(runs.flatMap((r) => (r.kind === "prose" ? [r.id] : [])));
  const notes = $derived(runs.reduce((count, r) => count + (r.kind === "prose" ? r.blocks.length : 0), 0));
  const key = $derived(`${flight.phase}:${gi}`);
  const open = $derived(flight.open.has(key));
  const done = $derived(flight.done(group.items));
  const rowNumber = (id: string) => flight.current.items.findIndex((i) => i.id === id);

  const toggle = () => (open ? flight.open.delete(key) : flight.open.add(key));
</script>

<section class={["grp", open && "open"]} data-g={gi}>{#if group.title || proseIds.length}<div class="ghead">{#if group.title}<h2>{group.title}</h2>{:else}<span class="gt"></span>{/if}{#if group.items.length}<span class={["ct", done === group.items.length && "ok"]}>{done}/{group.items.length}</span>{/if}{#if proseIds.length}<button class="notes" aria-expanded={open} aria-controls={proseIds.join(" ")} onclick={toggle}>{#if open}Hide notes{:else}<span aria-hidden="true">ⓘ</span> {notes}{notes === 1 ? " note" : " notes"}{/if}</button>{/if}</div>{/if}{#each runs as run, ri (ri)}{#if run.kind === "prose"}<div class="prose" id={run.id}>{#each run.blocks as block, bi (bi)}<Prose {block} />{/each}</div>{:else}<div class="rows">{#each run.block.items as item (item.id)}<Row {item} label={run.block.conditionLabel} n={rowNumber(item.id)} />{/each}</div>{/if}{/each}</section>
