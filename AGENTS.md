# Repository guidelines

`CLAUDE.md` is a symlink to `AGENTS.md`; edit `AGENTS.md`.

Fly is a SvelteKit app that turns markdown notes into one tick-off checklist
per aircraft. Every page is prerendered, and the build output is static files
served by Cloudflare Workers static assets at `fly.liyu.dev`.

## Project structure

- `aircraft/<slug>/` holds one aircraft's notes: the numbered procedure notes,
  `controls.md`, `names.md`, `lights.md`, and a `README.md` that names the
  FlyByWire pages the notes follow.
- `shared/` holds the sheets every aircraft uses. The build reads a sheet from
  the aircraft's own directory first, then from `shared/`, so an aircraft
  overrides a shared sheet by carrying its own copy under the same name.
- `src/lib/aircraft.ts` is the registry. Each entry has the slug, the name and
  the build settings that differ per aircraft (`railTitles`,
  `phaseLightColumns`, `aliases`). The route's param matcher
  (`src/params/aircraft.ts`) reads the same list.
- `src/lib/server/companion.ts` parses one aircraft's notes into the payload
  typed in `src/lib/companion/payload.ts`. It has no value imports, so
  `scripts/payload.ts` runs it on plain Node.
- `src/routes/[aircraft=aircraft]/+page.server.ts` reads the notes with
  `import.meta.glob`, builds the payload at prerender time, and prints the
  parser's report during `pnpm build`.
- `src/lib/companion/` is the UI. `Companion.svelte` owns the keyboard,
  tooltips and phase navigation, and `flight.svelte.ts` owns one aircraft's
  state (ticks, fields, phase, open sheet). Each component styles itself in a
  scoped `<style>` block, and reaches into a child component's markup with
  `:global()`.
- `src/app.css` holds what every component shares: the colour tokens, the
  resets, and the shared primitives `.hbtn`, `.bigbtn`, `.full`, `.prose`,
  `.note`, `.sr` and `.index`. The neutrals come from the Airbus panel
  palette, and `--panel` paints the header, rail and bottom bar around the
  black screen. The status colours keep the cockpit conventions: cyan is a
  value to set, green is done or as expected, amber is something to wait for.
- `src/routes/+page.svelte` sends `/` to the last aircraft used, or to
  `DEFAULT_AIRCRAFT`. `src/routes/+error.svelte` is the 404 page, served by
  `not_found_handling: "404-page"` in `wrangler.jsonc`.
- `static/` is copied into the build. `_headers` holds the cache rules.

## Commands

- `pnpm dev` starts the dev server. Notes edits reload the page.
- `pnpm check` runs svelte-check.
- `pnpm build` prerenders every aircraft into `build/`. It fails on any note
  that breaks the rules below.
- `pnpm payload <slug>` prints one aircraft's payload as JSON and its report on
  stderr. Diff two runs to see what a notes edit changes.
- `pnpm icons` regenerates `static/apple-icon.png` and `static/favicon.ico`
  from `static/icon.svg`. It needs `rsvg-convert` and ImageMagick.
- `pnpm preview` builds and serves `build/` with `wrangler dev`, including the
  404 handling.
- `pnpm deploy` builds, then `scripts/deploy.ts` runs `wrangler deploy` on
  `main` and `wrangler preview` on any other branch. It reads the branch from
  `WORKERS_CI_BRANCH` in Workers Builds and from git elsewhere.

There is no test suite. `pnpm check` and `pnpm build` are the gate, and
`.github/workflows/ci.yml` runs both on every push. Cloudflare Workers Builds
runs only the build, also on every push: `main` deploys to production and
other branches upload a preview version.

## Add an aircraft

1. Add an entry to `aircraft` in `src/lib/aircraft.ts`.
2. Create `aircraft/<slug>/` with the procedure notes, `controls.md`,
   `names.md`, `lights.md` and a `README.md` that names its sources.
3. Run `pnpm build` and read the report it prints for the new slug.

The switcher, the `/` redirect and the 404 page all read the registry, so
nothing else changes.

## Write the notes

### Procedure notes

The numeric filename prefix (`1-preflight.md`) sets the order and the digit
key that opens the phase. The prefixes run from 1 with no gaps or repeats, and
there are at most nine, because the companion binds the digits 1 to 9. The
build throws on a gap, a repeat or a tenth note.

The first paragraph of a note becomes the phase lede. `> [!NOTE]` blocks,
numbered lists, bullet lists and plain paragraphs render as notes, which Fly
mode hides behind a toggle and Learn mode shows. `V~1~`, `V~FE~` and the like
render as subscripts.

### Checklist tables

Procedure tables read control, action, condition:

| Control | Action | Condition |
| --- | --- | --- |
| [EXT PWR](controls.md#electrical) pushbutton | set **ON** | if AVAIL |

- The first heading decides whether a table is a checklist. It must contain
  `Control`, `Page / field`, `Field`, `Page`, `Step` or `Indication`.
- The first word of the action sets the row's kind. `VERIFY_VERBS` in
  `src/lib/server/companion.ts` (verify, check, confirm, scan and so on) make
  a `verify` row: look, do not touch. Its value renders green under a VERIFY
  badge. Every other verb makes an `act` row, rendered cyan. A verb in neither
  `VERIFY_VERBS` nor `ACT_VERBS` counts as `act`, and the build report lists
  it until you add it to one of them.
- The bold value is the target state. It gets a tooltip when `names.md` has
  the term.
- `–` in the condition column means unconditional. The third heading is free
  text and shows on the row (`Condition`, `Trigger`, `Wait for`, `Source`).
- An item's id comes from the phase, the control and the action text, and
  ticks are saved against it. Editing a row's control or action clears that
  row's tick. Inserting or reordering other rows does not, and neither does
  renaming a heading.

### Supporting files

- `controls.md` maps every control label to its deep link into the aircraft's
  flight deck docs. A procedure link carries the section as an anchor
  (`[FLAPS](controls.md#performance)`), which tells apart labels that appear
  on more than one panel. The build report lists any link it cannot resolve.
  The "What it is" column is for human readers and the build ignores it.
- `names.md` is the only full-name map. It fills the line under each control
  and the tooltip on a bolded value, in `abbreviations.md`'s style
  (`EXT PWR` is `EXTernal PoWeR`). A `–` marks a label that reads plainly on
  its own. The build report lists any `controls.md` label with no row here,
  and any two rows that disagree. Nothing resolves from `abbreviations.md`,
  which reads `RET` as return where a speed brake lever means retracted.
- `lights.md` is the light state matrix. `phaseLightColumns` in the registry
  names the matrix columns each phase's lights strip shows, by exact header
  text, and the build throws if a named column does not exist. Renaming a
  header means updating `phaseLightColumns`.

### Shared sheets

- `shared/abbreviations.md` is a verbatim copy of FlyByWire's
  [Airbus Terms and Abbreviations](https://docs.flybywiresim.com/pilots-corner/airliner/abbreviations/)
  page and the only source of the Abbreviations sheet. Refresh it by
  downloading it again, never by editing it:

  ```sh
  curl -sS https://raw.githubusercontent.com/flybywiresim/docs/primary/docs/pilots-corner/airliner/abbreviations.md \
    > shared/abbreviations.md
  ```

- `shared/atc-communications.md` holds the VATSIM call and response scripts.
  It is written from scratch, not taken from FlyByWire. Tokens such as
  `{CALLSIGN}` become fields on the Radio sheet's worksheet.

## Coding style

- TypeScript in strict mode, SvelteKit 2 with Svelte 5 runes.
- Two-space indentation and LF line endings (`.editorconfig`).
- PascalCase for components, camelCase for modules and variables.
- Svelte keeps a space at the end of an `{#if}` block only when you write it as
  `{" "}`. Rendered text that needs one there has to spell it out.

## Commits

Write clear, imperative commit messages ("Add the A350 notes").
