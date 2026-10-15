<script lang="ts">
  import type { ProseBlock } from "./payload";
  import Rich from "./Rich.svelte";

  let { block }: { block: ProseBlock } = $props();
</script>

{#if block.type === "para"}<p><Rich frag={block.frag} /></p>{:else if block.type === "note"}<p class="note"><Rich frag={block.frag} /></p>{:else if block.type === "steps"}<ol>{#each block.items as frag, i (i)}<li><Rich {frag} /></li>{/each}</ol>{:else}<ul>{#each block.items as frag, i (i)}<li><Rich {frag} /></li>{/each}</ul>{/if}
