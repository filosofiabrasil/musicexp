import {
  DetectedHit,
  Rhythm,
  Pattern,
  kindCode,
} from "../pandeiro-ui-base/types";
import { sessionMetrics, withinTolerance } from "../audio/timing";
import { ClickMode, Dynamic, SampleChoices } from "../music/score";
import { PLAYBACK_RATE } from "../audio/sampleLibrary";
export type StudySettings = {
  bpm: number;
  subdivision: number;
  tolerance: number;
  range: { start: number; end: number };
  groups: number[];
  source: "touch" | "mic";
  captureRate?: number | null;
  clickMode: ClickMode;
  dynamic: Dynamic;
  sampleChoices: SampleChoices;
  isolation: string | null;
  volume: number;
  guide: boolean;
  click: boolean;
  latencyMs: number;
};
export type StudyRecord = {
  id: string;
  createdAt: string;
  title: string;
  sequence: string;
  notes: string;
  elapsed: number;
  settings: StudySettings;
  metrics: ReturnType<typeof sessionMetrics>;
};
export type SessionExport = {
  schemaVersion: 1;
  appVersion: string;
  timingUnit: "seconds";
  errorUnit: "milliseconds";
  timestampMeaning: string;
  rhythm: Rhythm;
  record: StudyRecord;
  hits: DetectedHit[];
};
export const JOURNAL_LIMIT = 50;
export function makeRecord(
  rhythm: Rhythm,
  settings: StudySettings,
  pattern: Pattern,
  hits: DetectedHit[],
  elapsed: number,
  notes: string,
  identity?: { id: string; createdAt: string },
): StudyRecord {
  return {
    id:
      identity?.id ??
      `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`,
    createdAt: identity?.createdAt ?? new Date().toISOString(),
    title: rhythm.name,
    sequence: rhythm.sequence.slice(settings.range.start, settings.range.end),
    notes: notes.trim().slice(0, 3000),
    elapsed,
    settings: {
      ...settings,
      range: { ...settings.range },
      sampleChoices: { ...settings.sampleChoices },
    },
    metrics: sessionMetrics(
      hits,
      pattern,
      settings.range.end - settings.range.start,
      settings.bpm,
      settings.subdivision,
      settings.tolerance,
      elapsed,
    ),
  };
}
export function parseJournal(raw: string | null): StudyRecord[] {
  if (!raw) return [];
  const value: unknown = JSON.parse(raw);
  if (!Array.isArray(value) || value.length > JOURNAL_LIMIT)
    throw new Error(
      "Formato do caderno inválido. Os dados existentes foram preservados.",
    );
  const ids = new Set<string>();
  for (const row of value) {
    if (
      !row ||
      typeof row !== "object" ||
      typeof row.id !== "string" ||
      ids.has(row.id) ||
      typeof row.title !== "string" ||
      typeof row.sequence !== "string" ||
      !/^[PADBTXQMR.]{1,32}$/.test(row.sequence) ||
      typeof row.notes !== "string" ||
      !Number.isFinite(row.elapsed) ||
      row.elapsed < 0 ||
      !Number.isFinite(Date.parse(row.createdAt)) ||
      !row.settings ||
      !Number.isFinite(row.settings.bpm) ||
      row.settings.bpm < 30 ||
      row.settings.bpm > 240 ||
      ![2, 3, 4, 6, 8].includes(row.settings.subdivision) ||
      !["touch", "mic"].includes(row.settings.source) ||
      !row.metrics ||
      !["count", "correct", "expected", "mae", "mean", "std"].every((key) =>
        Number.isFinite(row.metrics[key]),
      )
    )
      throw new Error(
        "Registro ilegível no caderno. Nenhum dado foi sobrescrito.",
      );
    ids.add(row.id);
    const settings = row.settings;
    if (
      !settings.range ||
      !Number.isInteger(settings.range.start) ||
      !Number.isInteger(settings.range.end) ||
      settings.range.start < 0 ||
      settings.range.end > 32 ||
      settings.range.end - settings.range.start !== row.sequence.length ||
      !Array.isArray(settings.groups) ||
      settings.groups.some(
        (group: unknown) =>
          typeof group !== "number" || !Number.isInteger(group) || group < 1,
      ) ||
      settings.groups.reduce((a: number, b: number) => a + b, 0) !==
        row.sequence.length ||
      !["pulse", "subdivision", "groups"].includes(settings.clickMode) ||
      !["p", "mp", "mf", "f"].includes(settings.dynamic) ||
      !Number.isFinite(settings.volume) ||
      settings.volume < 0 ||
      settings.volume > 1 ||
      !Number.isFinite(settings.latencyMs) ||
      !Number.isFinite(settings.tolerance) ||
      settings.tolerance < 0 ||
      !["count", "correct", "expected"].every(
        (key) => Number.isInteger(row.metrics[key]) && row.metrics[key] >= 0,
      ) ||
      row.metrics.correct > row.metrics.expected ||
      row.metrics.mae < 0 ||
      row.metrics.std < 0
    )
      throw new Error(
        "Configuração ilegível no caderno. Os dados existentes foram preservados.",
      );
  }
  return value as StudyRecord[];
}
export function diagnoseHits(
  hits: DetectedHit[],
  pattern: Pattern,
  steps: number,
  bpm: number,
  subdivision: number,
  tolerance: number,
  now: number,
) {
  const dt = 60 / bpm / subdivision,
    completed = Math.floor(now / dt + 1e-9);
  const seen = new Map<number, number>();
  let wrongKind = 0,
    late = 0,
    unexpected = 0;
  for (const hit of hits) {
    const slot = Math.round(hit.nominal / dt);
    if (slot < 0 || slot >= completed) continue;
    seen.set(slot, (seen.get(slot) || 0) + 1);
    const expected = pattern[slot % steps];
    if (!expected) unexpected++;
    else if (expected !== hit.kind) wrongKind++;
    else if (!withinTolerance((hit.t - hit.nominal) * 1000, tolerance)) late++;
  }
  const metrics = sessionMetrics(
    hits,
    pattern,
    steps,
    bpm,
    subdivision,
    tolerance,
    now,
  );
  const covered = [...seen.keys()].filter(
    (slot) => !!pattern[slot % steps],
  ).length;
  return {
    missing: Math.max(0, metrics.expected - covered),
    wrongKind,
    late,
    unexpected,
    duplicates: [...seen.values()].reduce(
      (sum, count) => sum + Math.max(0, count - 1),
      0,
    ),
  };
}
const csvCell = (value: unknown) => {
  let text = String(value ?? "");
  if (/^[=+\-@\t\r]/.test(text) && typeof value !== "number") text = "'" + text;
  return `"${text.replace(/"/g, '""')}"`;
};
export function sessionCsv(data: SessionExport) {
  const { record } = data;
  const rows: unknown[][] = [
    [
      "study_id",
      "title",
      "bpm_quarter",
      "units_per_quarter",
      "range_start_1based",
      "range_end_1based",
      "tolerance_ms",
      "t_seconds",
      "nominal_seconds",
      "error_ms",
      "code",
      "kind",
      "input",
      "heuristic_similarity",
      "capture_rate_hz",
      "reference_buffer_rate_hz",
    ],
  ];
  for (const hit of data.hits)
    rows.push([
      record.id,
      record.title,
      record.settings.bpm,
      record.settings.subdivision,
      record.settings.range.start + 1,
      record.settings.range.end,
      record.settings.tolerance,
      hit.t,
      hit.nominal,
      (hit.t - hit.nominal) * 1000,
      kindCode(hit.kind),
      hit.kind,
      hit.source ?? record.settings.source,
      hit.confidence ?? "",
      record.settings.captureRate ?? "",
      PLAYBACK_RATE,
    ]);
  return rows.map((row) => row.map(csvCell).join(",")).join("\r\n") + "\r\n";
}
