<script lang="ts">
  import { flushSync, onMount, tick, untrack } from "svelte";
  import { pushState, replaceState } from "$app/navigation";
  import Bar from "./Bar.svelte";
  import Checklist from "./Checklist.svelte";
  import { setCompanion } from "./context";
  import { Flight, REFS } from "./flight.svelte";
  import Header from "./Header.svelte";
  import type { Payload, RefId } from "./payload";
  import Rail from "./Rail.svelte";
  import Reference from "./Reference.svelte";

  let { slug, name, payload }: { slug: string; name: string; payload: Payload } = $props();

  const flight = untrack(() => new Flight(slug, name, payload));

  let header = $state<HTMLElement>();
  let rail = $state<HTMLElement>();
  let main = $state<HTMLElement>();
  let bar = $state<HTMLElement>();
  let panel = $state<HTMLElement>();
  let tipEl = $state<HTMLElement>();
  let ready = $state(false);

  const touchFirst = () => matchMedia("(pointer: coarse)").matches;
  const mouseFirst = () => matchMedia("(pointer: fine)").matches;
  const glide = (): ScrollBehavior => (matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth");

  let tip: { text: string; anchor: Element; owner: Element } | null = $state.raw(null);

  function placeTip() {
    if (!tip || !tipEl) return;
    if (!tip.anchor.isConnected) return hideTip();
    tipEl.style.left = tipEl.style.top = "0px";
    const r = tip.anchor.getBoundingClientRect(), t = tipEl.getBoundingClientRect();
    tipEl.style.left = Math.max(8, Math.min(r.left + r.width / 2 - t.width / 2, innerWidth - t.width - 8)) + "px";
    tipEl.style.top = (r.top > t.height + 16 ? r.top - t.height - 7 : r.bottom + 7) + "px";
  }

  function showTip(anchor: Element, text: string, owner = anchor) {
    hideTip();
    tip = { text, anchor, owner };
    owner.setAttribute("aria-describedby", ((owner.getAttribute("aria-describedby") || "") + " tip").trim());
    flushSync();
    placeTip();
  }

  function hideTip() {
    if (!tip) return;
    const { owner } = tip;
    tip = null;
    const rest = (owner.getAttribute("aria-describedby") || "").split(" ").filter((id) => id && id !== "tip").join(" ");
    if (rest) owner.setAttribute("aria-describedby", rest);
    else owner.removeAttribute("aria-describedby");
  }

  function rowTip(row: Element) {
    const terms = [...row.querySelectorAll<HTMLElement>("[data-tip]")];
    if (terms.length) showTip(terms[0], terms.map((t) => t.textContent + ": " + t.dataset.tip).join("\n"), row);
  }

  function revealPhase(behavior: ScrollBehavior = glide()) {
    const b = rail?.children[flight.phase] as HTMLElement | undefined;
    if (!rail || !b) return;
    if (rail.scrollWidth > rail.clientWidth) rail.scrollTo({ left: b.offsetLeft - (rail.clientWidth - b.offsetWidth) / 2, behavior });
    else if (rail.scrollHeight > rail.clientHeight) rail.scrollTo({ top: b.offsetTop - (rail.clientHeight - b.offsetHeight) / 2, behavior });
  }

  async function showPhase(i: number) {
    const hadFocus = !!main?.contains(document.activeElement);
    hideTip();
    flight.setPhase(i);
    await tick();
    window.scrollTo({ top: 0, behavior: "instant" });
    revealPhase();
    if (hadFocus) document.getElementById("phase-title")?.focus({ preventScroll: true });
  }

  function goToPhase(i: number) {
    const p = flight.phases[i];
    if (!p || i === flight.phase) return;
    pushState(`#${p.id}`, {});
    showPhase(i);
  }

  function followHash() {
    if (location.pathname !== `/${flight.slug}`) return;
    const i = flight.phaseFromHash();
    if (i >= 0 && i !== flight.phase) showPhase(i);
  }

  const lineOf = (id: string) => main?.querySelector<HTMLElement>(`.line[data-id="${CSS.escape(id)}"]`);

  function reveal(id: string | undefined, focus: boolean) {
    const line = id && lineOf(id);
    if (!line) return;
    if (focus) (line.firstElementChild as HTMLElement).focus({ preventScroll: true });
    line.scrollIntoView({ block: "center", behavior: glide() });
  }

  function tickNext() {
    const nx = flight.next;
    if (!nx) return;
    flight.setTick(nx.id, true);
    reveal(flight.next?.id, false);
  }

  function toggleTick(id: string) {
    flight.cursor = id;
    flight.setTick(id, !flight.ticks[id]);
  }

  function moveCursorTo(id: string) {
    flight.cursor = id;
    reveal(id, true);
  }

  function moveCursor(step: number) {
    const ids = flight.current.items.map((i) => i.id);
    if (!ids.length) return;
    const at = flight.cursor ? ids.indexOf(flight.cursor) : -1;
    const nx = flight.next;
    const target = at >= 0 ? Math.max(0, Math.min(ids.length - 1, at + step))
      : nx ? ids.indexOf(nx.id)
      : step > 0 ? 0 : ids.length - 1;
    moveCursorTo(ids[target]);
  }

  function tickCursor() {
    const ids = flight.current.items.map((i) => i.id);
    const at = flight.cursor ? ids.indexOf(flight.cursor) : -1;
    if (at < 0) return tickNext();
    toggleTick(ids[at]);
    if (ids[at + 1]) moveCursorTo(ids[at + 1]);
  }

  function openRef(id: RefId) {
    if (flight.ref === id) return;
    if (!flight.ref) flight.filter = "";
    hideTip();
    flight.ref = id;
  }

  function closeRef() {
    if (!flight.ref) return;
    const id = flight.ref, hadFocus = !!document.getElementById("ref")?.contains(document.activeElement);
    flight.ref = null;
    hideTip();
    if (hadFocus) document.querySelector<HTMLElement>(`header [data-ref="${id}"]`)?.focus();
  }

  async function toggleRef(id: RefId) {
    if (flight.ref === id) return closeRef();
    openRef(id);
    if (id === "abbreviations" && mouseFirst()) {
      await tick();
      document.getElementById("ref-filter")?.focus({ preventScroll: true });
    }
  }

  let toast: { message: string; undo: () => void } | null = $state.raw(null);
  let toastEl = $state<HTMLElement>();
  let toastTimer = 0;

  function reset() {
    toast = { message: "Flight reset", undo: flight.reset() };
    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(hideToast, 6000);
  }

  function hideToast() {
    const hadFocus = !!toastEl?.contains(document.activeElement);
    toast = null;
    if (hadFocus) document.querySelector<HTMLElement>('[aria-label="Reset flight"]')?.focus();
  }

  setCompanion({ flight, goToPhase, tickNext, toggleTick, toggleRef, openRef, closeRef, reset });

  const TAB_KEYS: Record<string, (i: number) => number> = {
    ArrowRight: (i) => i + 1,
    ArrowLeft: (i) => i - 1,
    Home: () => 0,
    End: () => REFS.length - 1,
  };

  const KEYS: Record<string, () => void> = {
    j: () => moveCursor(1),
    k: () => moveCursor(-1),
    " ": tickCursor,
    escape: () => { hideTip(); closeRef(); flight.menu = false; },
    ...Object.fromEntries(REFS.map((r) => [r.key, () => toggleRef(r.id)])),
    ...Object.fromEntries(flight.phases.map((_, i) => [String(i + 1), () => goToPhase(i)])),
  };

  function onkeydown(e: KeyboardEvent) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const t = e.target as HTMLElement;
    if (t.matches("input:not([type=checkbox]):not([type=radio]), textarea, select")) {
      if (e.key === "Escape") t.blur();
      return;
    }
    const step = t.getAttribute("role") === "tab" && TAB_KEYS[e.key];
    if (step) {
      e.preventDefault();
      const next = REFS[(step(REFS.findIndex((r) => r.id === flight.ref)) + REFS.length) % REFS.length];
      openRef(next.id);
      tick().then(() => document.getElementById(`tab-${next.id}`)?.focus());
      return;
    }
    if (e.key === " " && t.matches("button, a")) return;
    const action = KEYS[e.key.toLowerCase()];
    if (!action) return;
    e.preventDefault();
    if (!(e.repeat && e.key === " ")) action();
  }

  function onclick(e: MouseEvent) {
    const term = touchFirst() && (e.target as Element).closest("[data-tip]");
    if (term) return tip?.anchor === term ? hideTip() : showTip(term, (term as HTMLElement).dataset.tip!);
    if (touchFirst()) hideTip();
  }

  function onfocusin(e: FocusEvent) {
    const target = e.target as HTMLElement;
    const row = target.closest(".row");
    if (row) flight.cursor = (row.parentElement as HTMLElement).dataset.id ?? null;
    if (!mouseFirst()) return;
    if (target.matches("[data-tip]")) showTip(target, target.dataset.tip!);
    else if (row && row.matches(":focus-visible")) rowTip(row);
  }

  function onfocusout(e: FocusEvent) {
    if (e.target === tip?.owner) hideTip();
  }

  function onmouseover(e: MouseEvent) {
    if (!mouseFirst()) return;
    const term = (e.target as Element).closest<HTMLElement>("[data-tip]");
    if (term && term !== tip?.anchor) showTip(term, term.dataset.tip!);
  }

  function onmouseout(e: MouseEvent) {
    const term = (e.target as Element).closest("[data-tip]");
    if (term && term === tip?.anchor && !term.contains(e.relatedTarget as Node) && tip.owner !== document.activeElement) hideTip();
  }

  onMount(() => {
    flight.restore();
    ready = true;
    tick().then(() => revealPhase("instant"));
    // SvelteKit starts its router only after hydration finishes, and replaceState throws before that.
    setTimeout(() => {
      if (!location.hash) replaceState(`#${flight.current.id}`, {});
    });
    addEventListener("scroll", placeTip, { capture: true, passive: true });
    const chromeHeights = new ResizeObserver(() => {
      const root = document.documentElement.style;
      if (header) root.setProperty("--header-h", header.offsetHeight + "px");
      if (bar) root.setProperty("--bar-h", bar.offsetHeight + "px");
    });
    if (header) chromeHeights.observe(header);
    if (bar) chromeHeights.observe(bar);
    document.fonts.ready.then(() => revealPhase("instant"));
    return () => {
      removeEventListener("scroll", placeTip, { capture: true });
      chromeHeights.disconnect();
      clearTimeout(toastTimer);
    };
  });
</script>

<svelte:document {onkeydown} {onclick} {onfocusin} {onfocusout} {onmouseover} {onmouseout} />
<svelte:window onresize={placeTip} onhashchange={followHash} onpopstate={followHash} onstorage={(e) => flight.syncFromOtherTab(e.key)} />

<a class="skip" href="#phase-title" onclick={(e) => { e.preventDefault(); document.getElementById("phase-title")?.focus(); }}>Skip to checklist</a>

<div class={["app", ready && "ready"]}>
  <Header bind:header />
  <Rail bind:rail />
  <Checklist bind:main />
  <Reference bind:panel />
  <Bar bind:bar />
</div>

<div id="tip" role="tooltip" hidden={!tip} bind:this={tipEl}>{tip?.text}</div>
<div id="toast" role="status" hidden={!toast} bind:this={toastEl}><span id="toast-msg">{toast?.message}</span><button onclick={() => { toast?.undo(); hideToast(); }}>Undo</button></div>
<div class="sr" id="live" aria-live="polite">{flight.live}</div>
