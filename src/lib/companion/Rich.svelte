<script lang="ts">
  import type { Frag } from "./payload";

  let { frag, presentational = false }: { frag: Frag | null; presentational?: boolean } = $props();
</script>

<!-- A tip term takes focus so keyboard users can read its tooltip. -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
{#each frag ?? [] as n, i (i)}{#if n.t === "b"}{#if n.tip}<b data-tip={n.tip} tabindex={presentational ? undefined : 0}>{n.v}</b>{:else}<b>{n.v}</b>{/if}{:else if n.t === "i"}<i>{n.v}</i>{:else if n.t === "sub"}<sub>{n.v}</sub>{:else if n.t === "link" && !presentational}<a href={n.href} target="_blank" rel="noopener">{n.v}</a>{:else}{n.v}{/if}{/each}
