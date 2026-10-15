<script lang="ts">
  import { aircraft, DEFAULT_AIRCRAFT } from "$lib/aircraft";
  import { KEYS } from "$lib/companion/storage";

  const slugs = aircraft.map((entry) => entry.slug);
  const redirect = `<script>
    let slug;
    try { slug = JSON.parse(localStorage.getItem(${JSON.stringify(KEYS.aircraft)})); } catch {}
    location.replace("/" + (${JSON.stringify(slugs)}.includes(slug) ? slug : ${JSON.stringify(DEFAULT_AIRCRAFT)}) + location.hash);
  <\/script>`;
</script>

<svelte:head>
  <title>Fly</title>
  <meta name="description" content="Gate to gate tick-off checklists for FlyByWire aircraft in Microsoft Flight Simulator." />
  {@html redirect}
</svelte:head>

<noscript>
  <main class="index">
    <h1>Fly</h1>
    <ul>
      {#each aircraft as entry (entry.slug)}
        <li><a href="/{entry.slug}">{entry.name}</a></li>
      {/each}
    </ul>
  </main>
</noscript>
