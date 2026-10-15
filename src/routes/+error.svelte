<script lang="ts">
  import { page } from "$app/state";
  import { aircraft } from "$lib/aircraft";
</script>

<svelte:head>
  <title>Fly · {page.status === 404 ? "Not found" : "Error"}</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<main class="index">
  <h1>{page.status === 404 ? "No such aircraft" : page.error?.message}</h1>
  <p class="lede">Pick a flight companion:</p>
  <ul>
    {#each aircraft as entry (entry.slug)}
      <li><a href="/{entry.slug}">{entry.name}</a></li>
    {/each}
  </ul>
</main>
