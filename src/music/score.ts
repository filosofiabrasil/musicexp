import { Rhythm, StrokeCode, CODES } from "../pandeiro-ui-base/types";

export const SUBDIVISIONS = [2, 3, 4, 6, 8] as const;
export const SUBDIVISION_NAMES: Record<number, string> = {
  2: "Colcheias",
  3: "Tercinas de colcheias",
  4: "Semicolcheias",
  6: "Sextinas de semicolcheias",
  8: "Fusas",
};
export type ClickMode = "pulse" | "subdivision" | "groups";
export type Dynamic = "p" | "mp" | "mf" | "f";
export const DYNAMIC_GAIN: Record<Dynamic, number> = {
  p: 0.35,
  mp: 0.5,
  mf: 0.7,
  f: 0.9,
};
export type SampleChoices = Partial<
  Record<import("../pandeiro-ui-base/types").Kind, string>
>;

export function parseSequence(input: string) {
  const value = input.toUpperCase().replace(/[\s|]/g, "");
  if (!/^[PADBTXQMR.]{1,32}$/.test(value))
    throw new Error(
      "Use de 1 a 32 unidades: P A D B T X Q M R ou ponto para pausa. Espaços e barras são separadores.",
    );
  return value;
}
export function parseGroups(input: string, steps: number) {
  if (!/^\s*\d+(\s*\+\s*\d+)*\s*$/.test(input))
    throw new Error("Escreva os grupos como 4+4+4+4 ou 2+2+3.");
  const groups = input.split("+").map(Number);
  if (
    groups.some((g) => !Number.isInteger(g) || g < 1 || g > 32) ||
    groups.reduce((a, b) => a + b, 0) !== steps
  )
    throw new Error(`A soma dos grupos deve ser ${steps}, o tamanho do ciclo.`);
  return groups;
}
export function defaultGroups(steps: number, subdivision: number) {
  return Array.from({ length: Math.ceil(steps / subdivision) }, (_, i) =>
    Math.min(subdivision, steps - i * subdivision),
  );
}
export function groupStarts(groups: number[]) {
  let at = 0;
  return groups.map((size) => {
    const start = at;
    at += size;
    return start;
  });
}
export function sliceGroups(groups: number[], start: number, end: number) {
  const starts = groupStarts(groups);
  return groups.flatMap((size, i) => {
    const overlap =
      Math.min(starts[i] + size, end) - Math.max(starts[i], start);
    return overlap > 0 ? [overlap] : [];
  });
}
export function clampRange(start: number, end: number, length: number) {
  const first = Math.max(0, Math.min(length - 1, Math.trunc(start)));
  return {
    start: first,
    end: Math.max(first + 1, Math.min(length, Math.trunc(end))),
  };
}
export function scorePosition(index: number, subdivision: number) {
  const beat = Math.floor(index / subdivision) + 1,
    part = index % subdivision;
  return part ? `${beat}+${part}/${subdivision}` : String(beat);
}
export function buildCustomRhythm(
  name: string,
  sequenceInput: string,
  subdivision: number,
  groupInput: string,
): Rhythm {
  const sequence = parseSequence(sequenceInput);
  if (!SUBDIVISIONS.includes(subdivision as (typeof SUBDIVISIONS)[number]))
    throw new Error("Subdivisão inválida.");
  const groups = parseGroups(groupInput, sequence.length);
  return {
    id: `custom-${sequence}-${subdivision}-${groups.join("-")}`,
    name: name.trim().slice(0, 64) || "Estudo pessoal",
    sequence,
    subdivision,
    groups,
    origin: "custom",
    group: "Escrita pessoal",
    groupId: "custom",
    description:
      "Exercício escrito pelo estudante. Agrupamento e articulações são escolhas de estudo.",
    subdivisionSource: "definida pelo estudante",
    sources: [],
    confidence: "custom",
    padbt: false,
    objective: "Documentar a intenção musical e comparar execuções.",
  };
}
export function sequenceInventory(sequence: string) {
  return CODES.filter((c) => sequence.includes(c)).map((code) => ({
    code: code as StrokeCode,
    count: [...sequence].filter((c) => c === code).length,
  }));
}
