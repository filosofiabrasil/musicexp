import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import { URL } from "node:url";
import {
  SUBDIVISIONS,
  buildCustomRhythm,
  clampRange,
  defaultGroups,
  groupStarts,
  parseGroups,
  parseSequence,
  scorePosition,
  sliceGroups,
} from "../src/music/score";
import { ETUDES } from "../src/music/etudes";
import {
  clickPositions,
  mixPlayback,
  playbackSteps,
} from "../src/audio/mixCycle";
import {
  PLAYBACK_RATE,
  SOUND_BANK,
  soundPcm,
  soundVariant,
} from "../src/audio/sampleLibrary";
import { CODES, STROKES, toPattern } from "../src/pandeiro-ui-base/types";
import {
  diagnoseHits,
  makeRecord,
  parseJournal,
  sessionCsv,
  StudySettings,
  SessionExport,
} from "../src/study/records";

const settings: StudySettings = {
  bpm: 100,
  subdivision: 4,
  tolerance: 15,
  range: { start: 0, end: 16 },
  groups: [4, 4, 4, 4],
  source: "touch",
  clickMode: "pulse",
  dynamic: "mf",
  sampleChoices: {},
  isolation: null,
  volume: 0.75,
  guide: true,
  click: true,
  latencyMs: 0,
};

test("escrita valida letras, separadores, pausas e limites sem inventar notas", () => {
  assert.equal(parseSequence("p d | b ."), "PDB.");
  for (const invalid of ["", "C#", "P".repeat(33), "P2D", "P💥D"])
    assert.throws(() => parseSequence(invalid));
  assert.equal(parseSequence("P".repeat(32)).length, 32);
});
test("agrupamento explicita a soma e recortes preservam os fragmentos", () => {
  assert.deepEqual(parseGroups("2 + 2 + 3", 7), [2, 2, 3]);
  for (const invalid of ["2+2", "0+7", "-1+8", "2.5+4.5", "3++4"])
    assert.throws(() => parseGroups(invalid, 7));
  assert.deepEqual(sliceGroups([4, 4, 4, 4], 2, 10), [2, 4, 2]);
  assert.deepEqual(groupStarts([2, 2, 3]), [0, 2, 4]);
  assert.deepEqual(defaultGroups(7, 4), [4, 3]);
  assert.deepEqual(clampRange(9, 2, 8), { start: 7, end: 8 });
  assert.equal(scorePosition(5, 4), "semínima 2 · subdivisão 2/4");
});
test("estudos originais têm fórmula compatível, grupos completos e acentos válidos", () => {
  assert.equal(ETUDES.length, 8);
  for (const study of ETUDES) {
    parseSequence(study.sequence);
    assert.equal(
      study.groups!.reduce((a, b) => a + b, 0),
      study.sequence.length,
    );
    const [numerator, denominator] = study.meter!.split("/").map(Number);
    assert.equal(
      study.sequence.length / study.subdivision,
      (numerator * 4) / denominator,
    );
    assert.ok(
      study.accents!.every(
        (index) => index >= 0 && index < study.sequence.length,
      ),
    );
    assert.equal(study.origin, "study");
  }
});
test("estudo pessoal mantém autoria própria e não presume fórmula de compasso", () => {
  const rhythm = buildCustomRhythm("Meu estudo", "P.DP.D.", 4, "3+4");
  assert.equal(rhythm.origin, "custom");
  assert.equal(rhythm.meter, undefined);
  assert.equal(rhythm.sources.length, 0);
  assert.throws(() => buildCustomRhythm("", "PDBD", 7, "4"));
});
test("metrônomo de semínima continua regular através de ciclos de sete unidades", () => {
  const config = {
    pattern: toPattern("PTPPPTP"),
    steps: 7,
    bpm: 100,
    subdivision: 4,
    guide: false,
    click: true,
  };
  assert.equal(playbackSteps(config), 28);
  assert.deepEqual(clickPositions(config), [0, 4, 8, 12, 16, 20, 24]);
  const playback = mixPlayback(config);
  assert.equal(playback.repetitions, 4);
  assert.equal(playback.logicalDuration, 4.2);
  assert.equal(playback.pcm.length, Math.round(4.2 * PLAYBACK_RATE));
  const clicks = clickPositions(config);
  assert.deepEqual(
    clicks
      .slice(1)
      .map((position, i) => position - clicks[i])
      .concat(28 - clicks[clicks.length - 1]),
    Array(7).fill(4),
  );
});
test("grupos 2+2+3 e pulso de 6/8 permanecem escolhas distintas", () => {
  const seven = {
    pattern: toPattern("PDPDPDD"),
    steps: 7,
    bpm: 100,
    subdivision: 2,
    guide: false,
    click: true,
    clickMode: "groups" as const,
    groups: [2, 2, 3],
  };
  assert.equal(playbackSteps(seven), 7);
  assert.deepEqual(clickPositions(seven), [0, 2, 4]);
  const six = {
    ...seven,
    steps: 6,
    pattern: toPattern("PDDTDD"),
    groups: [3, 3],
  };
  assert.deepEqual(clickPositions(six), [0, 3]);
  assert.deepEqual(clickPositions({ ...six, clickMode: "pulse" }), [0, 2, 4]);
});
test("todos os ciclos e subdivisões fecham no buffer sem desvio de pulso", () => {
  for (let steps = 1; steps <= 32; steps++)
    for (const subdivision of SUBDIVISIONS) {
      const span = playbackSteps({
        pattern: {},
        steps,
        bpm: 100,
        subdivision,
        guide: false,
        click: true,
      });
      assert.equal(span % steps, 0);
      assert.equal(span % subdivision, 0);
    }
});
test("banco conserva 43 gravações em nove famílias e WAVs de 44,1 kHz", () => {
  assert.equal(
    Object.values(SOUND_BANK).reduce((n, samples) => n + samples.length, 0),
    43,
  );
  const ids = new Set<string>();
  for (const code of CODES)
    for (const variant of SOUND_BANK[STROKES[code].kind]) {
      assert.ok(!ids.has(variant.id));
      ids.add(variant.id);
      const pcm = soundPcm(variant.kind, variant.id);
      assert.equal(pcm.length, variant.frames);
      assert.ok(pcm.length <= variant.sourceFrames);
      assert.ok(
        pcm.every(
          (value) => Number.isFinite(value) && Math.abs(value) <= 0.801,
        ),
      );
      assert.ok(pcm.some((value) => Math.abs(value) > 0.01));
      const wav = fs.readFileSync(
        new URL(`../assets/kit-44100/${variant.id}.wav`, import.meta.url),
      );
      assert.equal(wav.readUInt32LE(24), 44100);
      assert.equal(wav.readUInt32LE(40), variant.frames * 2);
    }
  assert.equal(
    soundVariant("grave", "arquivo-inexistente").id,
    SOUND_BANK.grave[0].id,
  );
});
test("ganho, acentos e escolha de amostra alteram o áudio preservando a grade", () => {
  const config = {
    pattern: toPattern("P..."),
    steps: 4,
    bpm: 100,
    subdivision: 4,
    guide: true,
    click: false,
  };
  const quiet = mixPlayback({ ...config, dynamicGain: 0.35 }).pcm,
    loud = mixPlayback({ ...config, dynamicGain: 0.9 }).pcm;
  assert.equal(quiet.length, loud.length);
  assert.ok(
    loud.reduce((s, v) => s + v * v, 0) > quiet.reduce((s, v) => s + v * v, 0),
  );
  const other = mixPlayback({
    ...config,
    samples: { grave: SOUND_BANK.grave[1].id },
  }).pcm;
  const baseline = mixPlayback(config).pcm,
    accented = mixPlayback({ ...config, accents: [0] }).pcm;
  assert.ok(other.some((v, i) => Math.abs(v - baseline[i]) > 0.01));
  assert.ok(
    accented.reduce((s, v) => s + v * v, 0) >
      baseline.reduce((s, v) => s + v * v, 0),
  );
});
test("caderno mantém resumo e rejeita corrupção sem descartar silenciosamente", () => {
  const rhythm = ETUDES[0],
    record = makeRecord(
      rhythm,
      settings,
      toPattern(rhythm.sequence),
      [{ t: 0, nominal: 0, kind: "grave", source: "touch" }],
      0.3,
      "Escutar a ressonância.",
      { id: "take-1", createdAt: "2026-11-10T12:00:00Z" },
    );
  assert.deepEqual(parseJournal(JSON.stringify([record])), [record]);
  assert.throws(() => parseJournal("{inválido"));
  assert.throws(() => parseJournal(JSON.stringify([record, record])));
  assert.throws(() =>
    parseJournal(
      JSON.stringify([
        { ...record, settings: { ...settings, range: undefined } },
      ]),
    ),
  );
  assert.throws(() =>
    parseJournal(
      JSON.stringify([
        { ...record, metrics: { ...record.metrics, correct: 999 } },
      ]),
    ),
  );
});
test("CSV conserva erro em ms, unidades, aspas e proteção contra fórmulas", () => {
  const rhythm = { ...ETUDES[0], name: '=HYPERLINK("teste")' },
    hits = [
      {
        t: 0.61,
        nominal: 0.6,
        kind: "grave" as const,
        source: "touch" as const,
      },
    ];
  const record = makeRecord(
    rhythm,
    settings,
    toPattern(rhythm.sequence),
    hits,
    1,
    "Observação",
  );
  const data: SessionExport = {
    schemaVersion: 1,
    appVersion: "test",
    timingUnit: "seconds",
    errorUnit: "milliseconds",
    timestampMeaning: "teste",
    rhythm,
    record,
    hits,
  };
  const csv = sessionCsv(data);
  assert.ok(csv.startsWith('"study_id","title","bpm_quarter"'));
  assert.ok(csv.includes("'" + '=HYPERLINK(""teste"")'));
  assert.ok(csv.includes('"0.61","0.6"'));
  assert.equal(csv.split("\r\n").filter(Boolean).length, 2);
});
test("diagnóstico distingue ausência, timbre divergente, repetição e golpe em pausa", () => {
  const pattern = toPattern("P.DT");
  const result = diagnoseHits(
    [
      { t: 0, nominal: 0, kind: "grave" },
      { t: 0.01, nominal: 0, kind: "grave" },
      { t: 0.125, nominal: 0.125, kind: "dedos" },
      { t: 0.25, nominal: 0.25, kind: "tapa" },
    ],
    pattern,
    4,
    120,
    4,
    15,
    0.5,
  );
  assert.equal(result.missing, 1);
  assert.equal(result.wrongKind, 1);
  assert.equal(result.duplicates, 1);
  assert.equal(result.unexpected, 1);
});
