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
