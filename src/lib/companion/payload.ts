export type Inline =
  | { t: "text"; v: string }
  | { t: "b"; v: string; tip?: string }
  | { t: "i"; v: string }
  | { t: "sub"; v: string }
  | { t: "link"; v: string; href: string };

export type Frag = Inline[];

export type ProseBlock =
  | { type: "para"; frag: Frag }
  | { type: "note"; frag: Frag }
  | { type: "steps"; items: Frag[] }
  | { type: "bullets"; items: Frag[] };

export type Item = {
  id: string;
  kind: "act" | "verify";
  control: Frag;
  full: string | null;
  action: Frag;
  condition: Frag | null;
};

export type ItemsBlock = { type: "items"; conditionLabel: string | null; items: Item[] };

export type MatrixBlock = {
  type: "matrix";
  head: string[];
  rows: string[][];
  fulls: (string | null)[] | null;
};

export type Turn = { who: "You" | "ATC"; tag: string | null; text: string };

export type ExchangeBlock = { type: "exchange"; title: string; turns: Turn[] };

export type Group<B> = { title: string; blocks: B[] };

export type PhaseLights = { when: string; set: { light: string; state: string; full: string | null }[] };

export type Phase = {
  id: string;
  num: string;
  title: string;
  short: string;
  lede: string | null;
  groups: Group<ProseBlock | ItemsBlock>[];
  lights: PhaseLights[];
};

export type Sheet<B> = { title: string; short: string; groups: Group<B>[] };

export type RadioSheet = Sheet<ExchangeBlock | ProseBlock> & { chain: string[] | null };

export type Token = { key: string; label: string };

export type Payload = {
  phases: Phase[];
  refs: {
    lights: Sheet<MatrixBlock | ProseBlock>;
    abbreviations: Sheet<MatrixBlock | ProseBlock>;
    atc: RadioSheet;
  };
  tokens: Token[];
};

export type RefId = keyof Payload["refs"];
