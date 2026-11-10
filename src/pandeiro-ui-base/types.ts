export type Kind =
  | "grave"
  | "abafado"
  | "dedos"
  | "punho"
  | "tapa"
  | "tapaPolegar"
  | "graveDedos"
  | "medio"
  | "rulo";
export type StrokeCode = "P" | "A" | "D" | "B" | "T" | "X" | "Q" | "M" | "R";
export type Pattern = Partial<Record<number, Kind>>;
/** Todos os tempos estão em segundos, no relógio da reprodução. */
export type DetectedHit = {
  t: number;
  nominal: number;
  kind: Kind;
  source?: "touch" | "mic";
  confidence?: number;
};
export type Rhythm = {
  id: string;
  name: string;
  group: string;
  groupId: string;
  sequence: string;
  description: string;
  subdivision: number;
  subdivisionSource: string;
  sources: string[];
  confidence: string;
  padbt: boolean;
  origin?: "library" | "study" | "custom";
  meter?: string;
  groups?: number[];
  accents?: number[];
  objective?: string;
};
export const THEME = {
  black: "#090909",
  ivory: "#F2F0E9",
  orange: "#F36915",
  silver: "#D7D7D2",
  panel: "#121211",
  line: "#30302D",
  muted: "#A7A69F",
  kind: {
    grave: "#F2F0E9",
    abafado: "#F2F0E9",
    tapa: "#F2F0E9",
    tapaPolegar: "#F2F0E9",
    graveDedos: "#F2F0E9",
    medio: "#D7D7D2",
    rulo: "#F2F0E9",
    punho: "#2FBF6A",
    dedos: "#FFC23D",
  } as Record<Kind, string>,
};
export const STROKES: Record<
  StrokeCode,
  { kind: Kind; name: string; height: number; key: string }
> = {
  P: { kind: "grave", name: "Grave · polegar", height: 1, key: "a" },
  D: { kind: "dedos", name: "Dedos", height: 0.36, key: "s" },
  T: { kind: "tapa", name: "Tapa", height: 0.78, key: "d" },
  B: { kind: "punho", name: "Punho", height: 0.53, key: "f" },
  A: { kind: "abafado", name: "Abafado", height: 0.87, key: "g" },
  X: { kind: "tapaPolegar", name: "Tapa de polegar", height: 0.73, key: "h" },
  Q: { kind: "graveDedos", name: "Grave de dedos", height: 0.94, key: "j" },
  M: { kind: "medio", name: "Médio", height: 0.62, key: "k" },
  R: { kind: "rulo", name: "Rulo", height: 0.67, key: "l" },
};
export const CODES = Object.keys(STROKES) as StrokeCode[];
export const kindCode = (kind: Kind) =>
  CODES.find((c) => STROKES[c].kind === kind)!;
export const toPattern = (sequence: string): Pattern =>
  Object.fromEntries(
    [...sequence].flatMap((code, i) =>
      code in STROKES ? [[i, STROKES[code as StrokeCode].kind]] : [],
    ),
  );
export const stepDuration = (bpm: number, subdivision = 4) =>
  60 / bpm / subdivision;
export const barDuration = (bpm: number, steps = 16, subdivision = 4) =>
  stepDuration(bpm, subdivision) * steps;
