# Fly

Flight sim checklists you tick off as you fly, gate to gate. Open one on a
tablet or a second screen beside Microsoft Flight Simulator, tick each step as
you go, and keep the lights matrix, the Airbus abbreviations and VATSIM
radio scripts one key away.

Live at [fly.liyu.dev](https://fly.liyu.dev). Two aircraft so far:

- [FlyByWire A32NX](https://fly.liyu.dev/fbw-a32nx)
- [FlyByWire A380X](https://fly.liyu.dev/fbw-a380x)

Your ticks, radio worksheet and current phase stay in your browser, one set per
aircraft. Nothing leaves the page.

## Keyboard

| Key | Does |
| --- | --- |
| <kbd>J</kbd> <kbd>K</kbd> | Move the cursor down and up the checklist |
| <kbd>Space</kbd> | Tick the row under the cursor, or the next unticked row |
| <kbd>1</kbd>–<kbd>9</kbd> | Jump to a flight phase |
| <kbd>L</kbd> <kbd>R</kbd> <kbd>A</kbd> | Open the Lights, Radio or Abbreviations sheet |
| <kbd>Esc</kbd> | Close the open sheet |

## Run it locally

You need Node 22.18 or later and pnpm.

```sh
pnpm install
pnpm dev
```

`pnpm dev` serves the companion at `http://localhost:5173`. Edits to the notes
in `aircraft/` and `shared/` reload the page.

To check a change before you push it, run `pnpm check` and `pnpm build`. The
build parses every aircraft's notes and fails on a numbering gap, a duplicate
row or a lights column that does not exist.

## Change the checklists

The checklists are markdown. Each aircraft has a directory under `aircraft/`
with one numbered note per flight phase. The conventions for writing a note
are in [AGENTS.md](AGENTS.md), and each aircraft's README says which FlyByWire
pages its notes follow.

## Credits

The procedures follow FlyByWire Simulations' beginner guides, and the
Abbreviations sheet is their Airbus Terms and Abbreviations page. Fly is not
affiliated with FlyByWire Simulations. See [NOTICE](NOTICE) for what each
part of the repo is licensed under.
