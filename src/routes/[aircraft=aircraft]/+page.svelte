<script lang="ts">
  import Companion from "$lib/companion/Companion.svelte";

  let { data } = $props();
</script>

<svelte:head>
  <title>Fly · {data.name}</title>
  <meta name="description" content="A gate to gate tick-off checklist for the {data.name} in Microsoft Flight Simulator, with the light matrix, abbreviations and VATSIM radio scripts." />
</svelte:head>

{#key data.slug}
  <Companion slug={data.slug} name={data.name} payload={data.payload} />
{/key}
