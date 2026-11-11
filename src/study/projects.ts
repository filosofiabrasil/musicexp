import { Rhythm } from "../pandeiro-ui-base/types";
import { buildCustomRhythm } from "../music/score";
import { meterFits } from "../music/notation";
export type WrittenStudy = { id: string; createdAt: string; rhythm: Rhythm };
export function parseProjects(raw: string | null): WrittenStudy[] {
  if (raw === null) return [];
  const value: unknown = JSON.parse(raw);
  if (!Array.isArray(value) || value.length > 30)
    throw new Error("Biblioteca pessoal ilegível. Os dados foram preservados.");
  const ids = new Set<string>();
  return value.map((row) => {
    if (
      !row ||
      typeof row.id !== "string" ||
      !row.id ||
      ids.has(row.id) ||
      typeof row.createdAt !== "string" ||
      !Number.isFinite(Date.parse(row.createdAt)) ||
      !row.rhythm ||
      typeof row.rhythm.name !== "string" ||
      typeof row.rhythm.sequence !== "string" ||
      !Array.isArray(row.rhythm.groups)
    )
      throw new Error("Escrita pessoal ilegível. Os dados foram preservados.");
    const original = row.rhythm;
    const rhythm = buildCustomRhythm(
      original.name,
      original.sequence,
      original.subdivision,
      original.groups.join("+"),
    );
    if (original.meter != null) {
      if (
        !meterFits(original.meter, rhythm.sequence.length, rhythm.subdivision)
      )
        throw new Error("Métrica da escrita inválida.");
      rhythm.meter = original.meter;
    }
    if (original.accents !== undefined) {
      if (
        !Array.isArray(original.accents) ||
        original.accents.some(
          (i: unknown) =>
            typeof i !== "number" ||
            !Number.isInteger(i) ||
            i < 0 ||
            i >= rhythm.sequence.length,
        )
      )
        throw new Error("Acentos da escrita inválidos.");
      rhythm.accents = [...new Set(original.accents as number[])];
    }
    ids.add(row.id);
    return { id: row.id, createdAt: row.createdAt, rhythm };
  });
}
export function projectKey(rhythm: Rhythm) {
  return JSON.stringify([
    rhythm.name,
    rhythm.sequence,
    rhythm.subdivision,
    rhythm.groups,
    rhythm.meter ?? null,
    [...(rhythm.accents ?? [])].sort((a, b) => a - b),
  ]);
}
