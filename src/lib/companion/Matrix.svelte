<script lang="ts">
  import type { MatrixBlock } from "./payload";

  let {
    block,
    highlight = [],
    lights = false,
    filter = "",
  }: { block: MatrixBlock; highlight?: string[]; lights?: boolean; filter?: string } = $props();

  const on = $derived(block.head.map((h) => highlight.includes(h)));
  const nil = (c: string) => /^[-–]?$/.test(c);
  const cls = (c: string, ci: number) =>
    [on[ci] && "hl", nil(c) ? "nil" : lights && !/required/i.test(c) && "val"].filter(Boolean).join(" ") || undefined;
  const shown = (r: string[]) => !filter || r.join("").toLowerCase().includes(filter);
</script>

<div class="scroll"><table><thead><tr>{#each block.head as h, i (i)}<th scope="col" class={on[i] ? "hl" : undefined}>{h}</th>{/each}</tr></thead><tbody>{#each block.rows as r, ri (ri)}<tr hidden={!shown(r)}>{#each r as c, ci (ci)}{#if !ci}<th scope="row">{c}{#if block.fulls?.[ri]}<span class="full">{block.fulls[ri]}</span>{/if}</th>{:else}<td class={cls(c, ci)}>{c}</td>{/if}{/each}</tr>{/each}</tbody></table></div>

<style>
  .scroll { overflow-x: auto; margin-bottom: 12px; }
  table { border-collapse: collapse; width: 100%; font-size: 12px; }
  th, td { padding: 5px 8px 5px 6px; border-bottom: 1px solid var(--line); text-align: left; vertical-align: top; font-weight: 400; }
  thead th { color: var(--muted); font-size: 11px; }
  td { color: var(--muted); }
  td.val { color: var(--action); }
  td.nil { color: var(--faint); }
  .hl { background: var(--tint); }
</style>
