<script lang="ts">
  import "@fontsource/b612/400.css";
  import "@fontsource/b612/700.css";
  import "@fontsource/b612-mono/400.css";
  import "@fontsource/b612-mono/700.css";
  import "../app.css";
  import { onMount } from "svelte";
  import { MediaQuery } from "svelte/reactivity";
  import { prefs, restorePrefs, SCHEMES } from "$lib/companion/prefs.svelte";
  import { KEYS } from "$lib/companion/storage";

  let { children } = $props();

  const prefersDark = new MediaQuery("(prefers-color-scheme: dark)");

  const applySavedPrefs = `<script>
    document.documentElement.dataset.mode = "fly";
    try {
      const scheme = JSON.parse(localStorage.getItem(${JSON.stringify(KEYS.scheme)}));
      if (scheme === "dark" || scheme === "light") document.documentElement.dataset.scheme = scheme;
      if (JSON.parse(localStorage.getItem(${JSON.stringify(KEYS.mode)})) === "learn") document.documentElement.dataset.mode = "learn";
    } catch {}
  <\/script>`;

  onMount(restorePrefs);

  $effect(() => {
    const root = document.documentElement;
    if (prefs.scheme === "auto") delete root.dataset.scheme;
    else root.dataset.scheme = prefs.scheme;
    root.dataset.mode = prefs.mode;
    const resolved = prefs.scheme === "auto" ? (prefersDark.current ? "dark" : "light") : prefs.scheme;
    document.querySelector('meta[name="color-scheme"]')?.setAttribute("content", prefs.scheme === "auto" ? "light dark" : prefs.scheme);
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", SCHEMES[resolved].paper);
  });
</script>

<svelte:head>
  {@html applySavedPrefs}
</svelte:head>

{@render children()}
