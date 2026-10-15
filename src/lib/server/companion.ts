/** No value imports, so scripts/payload.ts can run this on plain Node. */
import type { AircraftConfig } from "$lib/aircraft";
import type {
  ExchangeBlock,
  Frag,
  Group,
  Inline,
  Item,
  MatrixBlock,
  Payload,
  Phase,
  PhaseLights,
  ProseBlock,
  RadioSheet,
  Sheet,
  Token,
} from "$lib/companion/payload";

export type NoteFiles = { own: Record<string, string>; shared: Record<string, string> };

type TableBlock = { kind: "table"; head: string[]; body: string[][] };
type RawBlock = TableBlock | ProseBlock;
type HrefResolver = (text: string, target: string) => string | null;

const VERIFY_VERBS = new Set([
  "verify", "check", "checked", "confirm", "crosscheck", "scan", "look", "identify", "read", "note",
  "monitor", "review",
]);
const ACT_VERBS = new Set([
  "set", "select", "press", "enter", "adjust", "type", "dial", "push", "reset", "pull", "leave",
  "have", "load", "wait", "obtain", "deflect", "reinsert", "roll", "retract", "request", "be",
  "report", "match", "generate", "display", "link", "hold", "repeat", "scroll", "copy", "double",
  "arm", "advance", "perform", "steer", "preset", "revise", "compute", "draw", "descend", "keep",
  "fly", "aim", "out", "brake", "slow", "connect", "call", "run", "advise", "release",
]);

const stripMd = (md: string) =>
  md.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/<\/?sub>/g, "")
    .replace(/<br\s*\/?>\s*-\s*<\/br>/gi, " — ") // the vendored V1 cell's "or" separator
    .replace(/<br\s*\/?>|<\/br>/gi, " ")
    .replace(/~([^~\s]+)~/g, "$1")
    .replace(/\s+/g, " ")
    .trim();

const nameKey = (s: string) => s.trim().toUpperCase().replace(/\s+/g, " ");

const slugify = (s: string) =>
  s.toLowerCase().replace(/[`*_~]/g, "").replace(/[^\w\- ]/g, "").replace(/ /g, "-");

const cellsOf = (line: string) => line.split("|").slice(1, -1).map(c => c.trim());

function tableRows(lines: string[]): TableBlock {
  const [head, _separator, ...body] = lines.map(cellsOf);
  return { kind: "table", head, body };
}

const FOOTNOTE_MARKER = /\[\^[^\]]+\]/g;
const NAV_FOOTER = /^---\s*$/;
const READS_PLAINLY = /^[-–—]$/;
const ATC_SECTIONS_RENDERED_ELSEWHERE = /^(flight worksheet|phonetic alphabet|numbers)$/i;

const INLINE =
  /(?<link>\[(?<linkText>[^\]]*)\]\((?<linkTarget>[^)]+)\))|\*\*(?<bold>[^*]+)\*\*|<sub>(?<sub>[^<]*)<\/sub>|`(?<code>[^`]*)`|\*(?<italic>[^*]+)\*|~(?<tilde>[^~\s]+)~/;

const norm = (s: string) => s.toUpperCase().replace(/\s+/g, " ").trim();
const shortest = (keys: string[]) => keys.sort((a, b) => a.length - b.length)[0];
const longest = (keys: string[]) => keys.sort((a, b) => b.length - a.length)[0];

/** Ways a procedure label can name a controls.md row, tried in order. */
const CONTROL_MATCHERS: ((keys: string[], label: string) => string | undefined)[] = [
  function exact(keys, label) {
    return keys.includes(label) ? label : undefined;
  },
  function keyExtendsLabel(keys, label) {
    return shortest(keys.filter(k => k.startsWith(label)));
  },
  function labelExtendsKey(keys, label) {
    return longest(keys.filter(k => label.startsWith(k)));
  },
  function labelListedInParens(keys, label) {
    return keys.find(k => {
      const inner = (k.match(/\(([^)]*)\)/) || [])[1];
      return inner && inner.split(",").map(norm).includes(label);
    });
  },
  function labelWordsInOrder(keys, label) {
    const words = label.split(" ");
    return shortest(keys.filter(k => {
      const kt = k.split(" ").filter(t => t !== "/" && t !== "&");
      let j = 0;
      for (const t of kt) if (t === words[j]) j++;
      return j === words.length;
    }));
  },
];

const idPart = (s: string, max: number) => stripMd(s).slice(0, max).replace(/\s+/g, "_");

export function buildCompanion(config: AircraftConfig, files: NoteFiles): { payload: Payload; report: string[] } {
  const read = (name: string) => {
    const text = files.own[name] ?? files.shared[name];
    if (text === undefined) throw new Error(`${config.slug} has no ${name}, in its own notes or in shared/`);
    return text;
  };

  const duplicateNames: string[] = [];
  const unresolved = new Set<string>();
  const nameless = new Set<string>();
  const idSeen = new Map<string, number>();
  const unknownVerbs = new Set<string>();

  const names: Record<string, string | null> = {};
  for (const line of read("names.md").split("\n")) {
    if (!line.startsWith("|")) continue;
    const cells = cellsOf(line);
    if (cells.length !== 2) continue;
    const name = stripMd(cells[0]);
    const full = stripMd(cells[1]);
    if (!name || /^-+$/.test(name) || name === "Name") continue;
    const key = nameKey(name);
    const value = !full || READS_PLAINLY.test(full) ? null : full;
    if (key in names && names[key] !== value) duplicateNames.push(key);
    names[key] = value;
  }

  const nameOf = (s: string) => names[nameKey(s)] ?? null;

  const sections = new Map<string, Map<string, string>>();
  const global = new Map<string, string>();
  const controlLabels: string[] = [];
  {
    let slug = "";
    for (const line of read("controls.md").split("\n")) {
      const h = line.match(/^#{2,3}\s+(.*)$/);
      if (h) { slug = slugify(stripMd(h[1])); sections.set(slug, new Map()); continue; }
      if (!line.startsWith("|")) continue;
      const cells = cellsOf(line);
      if (cells.length !== 3) continue;
      const name = stripMd(cells[0]);
      const url = (cells[2].match(/\((https?:\/\/[^)]+)\)/) || [])[1];
      if (!name || !url || /^(Control|Page \/ field|Indication|Panel)$/.test(name)) continue;
      controlLabels.push(name);
      sections.get(slug)?.set(name.toUpperCase(), url);
      if (!global.has(name.toUpperCase())) global.set(name.toUpperCase(), url);
    }
  }

  function within(map: Map<string, string>, label: string) {
    const keys = [...map.keys()];
    for (const match of CONTROL_MATCHERS) {
      const key = match(keys, label);
      if (key) return map.get(key)!;
    }
    return null;
  }

  const aliases: Record<string, string> = config.aliases;

  function lookupControl(label: string, anchor: string) {
    const map = (anchor && sections.get(anchor)) || global;
    const q = norm(label);
    const tries = [q];
    if (aliases[q]) tries.push(norm(aliases[q]));
    if (q.includes(" / ")) {
      const last = norm(q.split(" / ").pop()!);
      tries.push(last);
      if (aliases[last]) tries.push(norm(aliases[last]));
    }
    for (const t of tries) {
      const hit = within(map, t) ?? (map !== global ? within(global, t) : null);
      if (hit) return hit;
    }
    return null;
  }

  const controlHref: HrefResolver = (text, target) => {
    if (/^https?:/.test(target)) return target;
    if (!/^controls\.md/.test(target)) return null;
    const anchor = (target.split("#")[1] || "").trim();
    if (!anchor) return null;
    const url = lookupControl(text, anchor);
    if (!url) unresolved.add(`${text} (#${anchor})`);
    return url;
  };

  function parseInline(md: string, resolveHref: HrefResolver = () => null): Frag {
    const out: Frag = [];
    let rest = md.replace(FOOTNOTE_MARKER, "");
    const push = (t: Inline["t"], v: string, href?: string | null) => {
      if (v === "") return;
      const tip = t === "b" ? nameOf(v) : null;
      out.push((href ? { t, v, href } : tip ? { t, v, tip } : { t, v }) as Inline);
    };

    let m;
    while ((m = INLINE.exec(rest))) {
      push("text", rest.slice(0, m.index));
      const g = m.groups!;
      if (g.link !== undefined) {
        const href = resolveHref(g.linkText, g.linkTarget) ?? (/^https?:/.test(g.linkTarget) ? g.linkTarget : null);
        if (href) push("link", g.linkText, href); else push("text", g.linkText);
      } else if (g.bold !== undefined) push("b", g.bold);
      else if (g.sub !== undefined) push("sub", g.sub);
      else if (g.code !== undefined) push("b", g.code);
      else if (g.italic !== undefined) push("i", g.italic);
      else if (g.tilde !== undefined) push("sub", g.tilde); // V~2~, the FlyByWire subscript spelling
      rest = rest.slice(m.index + m[0].length);
    }
    push("text", rest);
    return out;
  }

  function controlFull(cell: string) {
    const m = cell.match(/\[([^\]]+)\]\(controls\.md#[^)]+\)/);
    const label = m ? m[1] : stripMd(cell);
    if (!(nameKey(label) in names)) nameless.add(label);
    return nameOf(label);
  }

  function parseSections(md: string) {
    const lines = md.split("\n");
    const groups: Group<RawBlock>[] = [];
    let g: Group<RawBlock> | null = null;
    let i = 0;

    const ensure = () => {
      if (!g) { g = { title: "", blocks: [] }; groups.push(g); }
      return g;
    };

    while (i < lines.length) {
      const line = lines[i];

      const h = line.match(/^#{2,3}\s+(.*)$/);
      if (h) {
        g = { title: stripMd(h[1]), blocks: [] };
        groups.push(g);
        i++;
        continue;
      }
      if (/^#\s/.test(line)) { i++; continue; }
      if (NAV_FOOTER.test(line)) break;

      if (line.startsWith("|")) {
        const buf = [];
        while (i < lines.length && lines[i].startsWith("|")) buf.push(lines[i++]);
        ensure().blocks.push(tableRows(buf));
        continue;
      }

      if (/^>\s*\[!NOTE\]/.test(line)) {
        i++;
        const buf = [];
        while (i < lines.length && lines[i].startsWith(">")) buf.push(lines[i++].replace(/^>\s?/, ""));
        ensure().blocks.push({ type: "note", frag: parseInline(buf.join(" ").trim(), controlHref) });
        continue;
      }

      if (/^\d+\.\s/.test(line)) {
        const items: string[] = [];
        while (i < lines.length) {
          const m = lines[i].match(/^\d+\.\s+(.*)$/);
          if (m) { items.push(m[1]); i++; }
          else if (/^\s{2,}\S/.test(lines[i]) && items.length) { items[items.length - 1] += " " + lines[i].trim(); i++; }
          else break;
        }
        ensure().blocks.push({ type: "steps", items: items.map(t => parseInline(t, controlHref)) });
        continue;
      }

      if (/^[-*]\s+/.test(line)) {
        const items: string[] = [];
        while (i < lines.length) {
          const m = lines[i].match(/^[-*]\s+(.*)$/);
          if (m) { items.push(m[1]); i++; }
          else if (/^\s{2,}\S/.test(lines[i]) && items.length) { items[items.length - 1] += " " + lines[i].trim(); i++; }
          else break;
        }
        ensure().blocks.push({ type: "bullets", items: items.map(t => parseInline(t, controlHref)) });
        continue;
      }

      if (/^\[\^/.test(line)) {
        const buf = [line.replace(/^\[\^[^\]]+\]:\s*/, "")];
        i++;
        while (i < lines.length && lines[i].trim() && !/^(#|\||>|\d+\.|\[\^)/.test(lines[i])) buf.push(lines[i++].trim());
        ensure().blocks.push({ type: "note", frag: parseInline(buf.join(" ").trim(), controlHref) });
        continue;
      }

      if (line.trim()) {
        const buf = [line];
        i++;
        while (i < lines.length && lines[i].trim() && !/^(#|\||>|\d+\.|\[\^|---|[-*]\s)/.test(lines[i])) buf.push(lines[i++]);
        const text = buf.join(" ").replace(FOOTNOTE_MARKER, "").trim();
        if (text) ensure().blocks.push({ type: "para", frag: parseInline(text, controlHref) });
        continue;
      }
      i++;
    }
    return groups;
  }

  function itemId(phase: string, control: string, action: string) {
    const base = `${phase}:${idPart(control, 24)}:${idPart(action, 16)}`;
    const n = (idSeen.get(base) ?? 0) + 1;
    idSeen.set(base, n);
    return n === 1 ? base : `${base}#${n}`;
  }

  function itemKind(action: string): Item["kind"] {
    const verb = (stripMd(action).split(" ")[0] || "").toLowerCase().replace(/[.,;:!?]+$/, "");
    if (VERIFY_VERBS.has(verb)) return "verify";
    if (!ACT_VERBS.has(verb)) unknownVerbs.add(verb || "(empty)");
    return "act";
  }

  const railTitles: Record<string, string> = config.railTitles;
  const phaseLightColumns: Record<string, readonly string[]> = config.phaseLightColumns;

  function buildProcedure(slug: string, num: number): Omit<Phase, "lights"> {
    const md = read(`${slug}.md`);
    const title = stripMd((md.match(/^#\s+(.*)$/m) || [])[1] || slug);
    const groups: Phase["groups"] = parseSections(md).map(g => ({
      title: g.title,
      blocks: g.blocks.map(b => {
        if (!("kind" in b)) return b;
        const head = b.head.map(h => h.toLowerCase());
        const isChecklist = /control|page \/ field|field|page|step|indication/.test(head[0]);
        if (!isChecklist) return { type: "para", frag: parseInline(b.head.join(" · "), controlHref) };
        return {
          type: "items",
          conditionLabel: b.head[2] || null,
          items: b.body.map(r => ({
            id: itemId(slug, r[0], r[1] || ""),
            kind: itemKind(r[1] || ""),
            control: parseInline(r[0], controlHref),
            full: controlFull(r[0]),
            action: parseInline(r[1] || "", controlHref),
            condition: r[2] && r[2] !== "–" && r[2] !== "-" ? parseInline(r[2], controlHref) : null,
          })),
        };
      }),
    }));

    let lede = null;
    const first = groups[0];
    const opening = first?.blocks[0];
    if (first && !first.title && opening?.type === "para") {
      first.blocks.shift();
      lede = opening.frag.map(n => n.v).join("");
      if (!first.blocks.length) groups.shift();
    }

    return {
      id: slug,
      num: String(num),
      title: title.replace(/^\d+\s+·\s+/, num + " · "),
      short: railTitles[slug] ?? title.replace(/^\d+\s+·\s+/, ""),
      lede,
      groups,
    };
  }

  function matrixGroups(md: string, withFulls = true): Group<MatrixBlock | ProseBlock>[] {
    return parseSections(md).map(g => ({
      title: g.title,
      blocks: g.blocks.map(b => {
        if (!("kind" in b)) return b;
        return {
          type: "matrix",
          head: b.head.map(stripMd),
          rows: b.body.map(r => r.map(stripMd)),
          fulls: withFulls ? b.body.map(r => controlFull(r[0])) : null,
        };
      }),
    }));
  }

  function phaseLights(slug: string, sheet: Sheet<MatrixBlock | ProseBlock>): PhaseLights[] {
    const matrices = sheet.groups.flatMap(g => g.blocks.filter(b => b.type === "matrix"));
    return (phaseLightColumns[slug] ?? []).map(when => {
      const columns = matrices.map(m => ({ m, col: m.head.indexOf(when) })).filter(c => c.col > 0);
      if (!columns.length) throw new Error(`lights.md has no "${when}" column, which phaseLightColumns maps to ${slug}`);
      const set = columns.flatMap(({ m, col }) => m.rows.flatMap((r, ri) =>
        /^[-–]?$/.test(r[col]) ? [] : [{ light: r[0], state: r[col], full: m.fulls?.[ri] ?? null }]));
      return { when, set };
    }).filter(entry => entry.set.length);
  }

  function buildATC(): { sheet: RadioSheet; tokens: Token[] } {
    const lines = read("atc-communications.md").split("\n");

    const tokens: Token[] = [];
    const seen = new Set<string>();
    for (const line of lines) {
      const m = line.match(/^\|\s*`\{([A-Z0-9 _+]+)\}`\s*\|\s*([^|]+)\|/);
      if (m && !seen.has(m[1])) { seen.add(m[1]); tokens.push({ key: m[1], label: m[2].trim() }); }
    }

    const groups: Group<ExchangeBlock | ProseBlock>[] = [];
    let g: Group<ExchangeBlock | ProseBlock> | null = null;
    let ex: ExchangeBlock | null = null;
    let chain: string[] | null = null;
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      const h2 = line.match(/^##\s+(.*)$/);
      if (h2) {
        const title = stripMd(h2[1]);
        if (/handoff chain/i.test(title)) {
          const buf = [];
          i++;
          while (i < lines.length && !/^##\s/.test(lines[i])) buf.push(lines[i++]);
          const fence = (buf.join("\n").match(/```mermaid\n([\s\S]*?)```/) || [])[1] || "";
          const stations = [...fence.matchAll(/\[([A-Za-z ]+)\]/g)].map(m => m[1]);
          chain = [...new Set(stations)];
          continue;
        }
        if (ATC_SECTIONS_RENDERED_ELSEWHERE.test(title)) {
          i++;
          while (i < lines.length && !/^##\s/.test(lines[i])) i++;
          continue;
        }
        g = { title: title.replace(/^\d+\s+·\s+/, ""), blocks: [] };
        groups.push(g); ex = null; i++;
        continue;
      }

      const h3 = line.match(/^###\s+(.*)$/);
      if (h3 && g) { ex = { type: "exchange", title: stripMd(h3[1]), turns: [] }; g.blocks.push(ex); i++; continue; }

      const sp = line.match(/^\*\*(You|ATC)\*\*(?:\s*—\s*(.*))?$/);
      if (sp && g) {
        if (!ex) { ex = { type: "exchange", title: "", turns: [] }; g.blocks.push(ex); }
        i++;
        const buf = [];
        while (i < lines.length && /^>/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, ""));
        ex.turns.push({ who: sp[1] as "You" | "ATC", tag: sp[2] ? sp[2].trim() : null, text: buf.join(" ").replace(/\s+/g, " ").trim() });
        continue;
      }

      if (/^>\s*\[!NOTE\]/.test(line) && g) {
        i++;
        const buf = [];
        while (i < lines.length && lines[i].startsWith(">")) buf.push(lines[i++].replace(/^>\s?/, ""));
        g.blocks.push({ type: "note", frag: parseInline(buf.join(" ").trim()) });
        continue;
      }

      if (line.trim() && !line.startsWith("#") && !line.startsWith("|") && !/^---/.test(line) && g) {
        const buf = [line]; i++;
        while (i < lines.length && lines[i].trim() && !/^(#|\||>|\*\*(You|ATC)\*\*|---)/.test(lines[i])) buf.push(lines[i++]);
        g.blocks.push({ type: "para", frag: parseInline(buf.join(" ").trim()) });
        continue;
      }
      i++;
    }

    const used = new Set<string>();
    groups.forEach(gr => gr.blocks.forEach(b => {
      if (b.type === "exchange") b.turns.forEach(t => [...t.text.matchAll(/\{([A-Z0-9 _+]+)\}/g)].forEach(m => used.add(m[1])));
    }));
    for (const k of used) if (!seen.has(k)) tokens.push({ key: k, label: k.toLowerCase() });

    return { sheet: { title: "ATC Communications", short: "Radio", chain, groups }, tokens };
  }

  const procedures = Object.keys(files.own)
    .map(file => file.match(/^(\d+)-.+\.md$/))
    .filter(m => m !== null)
    .map(m => ({ file: m[0], slug: m[0].slice(0, -3), num: Number(m[1]) }))
    .sort((a, b) => a.num - b.num);

  if (procedures.some((p, i) => p.num !== i + 1)) {
    const listed = procedures.map(p => p.file).join(", ");
    throw new Error(`procedure notes must be numbered 1-${procedures.length} with no gaps or repeats: ${listed}`);
  }
  if (procedures.length > 9) {
    throw new Error(`${procedures.length} procedures: the companion only binds digits 1-9 to phases`);
  }
  const strayLights = Object.keys(phaseLightColumns).filter(note => !procedures.some(p => p.slug === note));
  if (strayLights.length) throw new Error(`${config.slug} phaseLightColumns names notes that do not exist: ${strayLights.join(", ")}`);

  const abbreviations = {
    title: "Airbus Terms and Abbreviations", short: "Abbreviations",
    groups: matrixGroups(read("abbreviations.md"), false),
  };
  const atc = buildATC();
  const phases = procedures.map(p => buildProcedure(p.slug, p.num));
  const lights = { title: "Lights by Phase", short: "Lights", groups: matrixGroups(read("lights.md")) };
  const payload: Payload = {
    phases: phases.map(p => ({ ...p, lights: phaseLights(p.id, lights) })),
    refs: { lights, abbreviations, atc: atc.sheet },
    tokens: atc.tokens,
  };

  const items = payload.phases.flatMap(p => p.groups.flatMap(g => g.blocks.flatMap(b => (b.type === "items" ? b.items : []))));
  const ids = items.map(i => i.id);
  if (new Set(ids).size !== ids.length) {
    const dupes = ids.filter((id, n) => ids.indexOf(id) !== n);
    throw new Error(`duplicate item ids: ${[...new Set(dupes)].join(", ")}`);
  }

  const turns = atc.sheet.groups.flatMap(g => g.blocks.flatMap(b => (b.type === "exchange" ? b.turns : [])));
  const abbreviationRows = abbreviations.groups.flatMap(g => g.blocks.flatMap(b => (b.type === "matrix" ? b.rows : []))).length;
  const linked = items.filter(i => i.control.some(n => n.t === "link")).length;
  const named = items.filter(i => i.full).length;
  const uncovered = [...new Set(controlLabels)].filter(l => !(nameKey(l) in names));

  const report = [
    `${payload.phases.length} phases · ${Object.keys(payload.refs).length} reference sheets · ${items.length} checklist items · ${turns.length} radio calls · ${payload.tokens.length} worksheet fields`,
    `${linked}/${items.length} items linked to FlyByWire docs`,
    `${named}/${items.length} items carry a full control name`,
    `${Object.values(names).filter(Boolean).length} names · ${abbreviationRows} abbreviation rows`,
    nameless.size && `no full name: ${[...nameless].join(", ")}`,
    unresolved.size && `unresolved control links: ${[...unresolved].join(", ")}`,
    unknownVerbs.size && `action verbs in neither VERIFY_VERBS nor ACT_VERBS: ${[...unknownVerbs].join(", ")}`,
    duplicateNames.length && `conflicting names.md keys: ${[...new Set(duplicateNames)].join(", ")}`,
    uncovered.length && `controls.md labels missing from names.md: ${uncovered.join(", ")}`,
  ].filter(line => typeof line === "string");

  return { payload, report };
}
