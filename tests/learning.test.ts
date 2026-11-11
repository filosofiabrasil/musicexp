import test from "node:test";
import assert from "node:assert/strict";
import glyphs from "../src/data/music-glyphs.json";
import {
  meterFits,
  metricGroups,
  countingGroups,
  noteValue,
  beamRuns,
  meterUnits,
} from "../src/music/notation";
import { programPlan, programStage, StudyProgram } from "../src/music/program";
import { mixPlayback } from "../src/audio/mixCycle";
import { PLAYBACK_RATE, SOUND_BANK } from "../src/audio/sampleLibrary";
import { toPattern } from "../src/pandeiro-ui-base/types";
import { ETUDES } from "../src/music/etudes";
import { makeRecord, StudySettings } from "../src/study/records";
import { compareTakes } from "../src/study/compare";
import { parseProjects, projectKey } from "../src/study/projects";
import { LISTENING_PAIRS, listeningQuestion } from "../src/music/listening";
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

test("imagem de oito semicolcheias fecha 2/4 com duas contagens de quatro unidades", () => {
  assert.equal(meterFits("2/4", 8, 4), true);
  assert.equal(meterUnits("2/4", 4), 8);
  assert.deepEqual(noteValue(4), { denominator: 16, beams: 2, tuplet: null });
  assert.deepEqual(countingGroups(8, 4, "2/4"), [
    { start: 0, size: 4, bar: 1, number: 1 },
    { start: 4, size: 4, bar: 1, number: 2 },
  ]);
  assert.deepEqual(
    countingGroups(16, 4, "2/4").map((g) => [g.bar, g.number]),
    [
      [1, 1],
      [1, 2],
      [2, 1],
      [2, 2],
    ],
  );
});
test("6/8 conta dois pulsos compostos e 7/8 respeita agrupamento aditivo", () => {
  assert.deepEqual(
    countingGroups(6, 2, "6/8").map((g) => [g.start, g.size, g.number]),
    [
      [0, 3, 1],
      [3, 3, 2],
    ],
  );
  assert.deepEqual(metricGroups(12, 4, "6/8"), [6, 6]);
  assert.deepEqual(
    countingGroups(7, 2, "7/8").map((g) => g.size),
    [2, 2, 3],
  );
  assert.deepEqual(
    countingGroups(7, 2, "7/8", [3, 2, 2]).map((g) => g.size),
    [3, 2, 2],
  );
  assert.equal(
    meterFits("6/8", 9, 3),
    false,
    "o editor não representa fronteiras em meia unidade",
  );
  assert.equal(meterFits("2/4", 7, 4), false);
  assert.equal(meterFits("4/4", 24, 6), true);
});
test("travessas quebram em pausas, compassos e quiálteras, sem inventar ataques", () => {
  assert.deepEqual(beamRuns("P.DD.P", 4, [6]), [[0], [2, 3], [5]]);
  assert.deepEqual(beamRuns("PDDPDD", 3, [6]), [
    [0, 1, 2],
    [3, 4, 5],
  ]);
  assert.deepEqual(beamRuns("DDDDDDDD", 4, [8], 4), [
    [0, 1, 2, 3],
    [4, 5, 6, 7],
  ]);
  assert.deepEqual(noteValue(6).tuplet, [6, 4]);
  assert.throws(() => noteValue(5));
});
test("símbolos de duração são contornos Bravura reais e não dependem de fonte do aparelho", () => {
  assert.equal(Object.keys(glyphs.glyphs).length, 19);
  for (const glyph of Object.values(glyphs.glyphs)) {
    assert.ok(glyph.path.length > 10);
    assert.ok(glyph.bounds.every(Number.isFinite));
    assert.ok(!glyph.path.includes("NaN"));
  }
});
test("programas explicitam entrada, limite e as três fases de memória", () => {
  assert.equal(programPlan("free").cycles, 0);
  assert.equal(programPlan("steady").countIn, 4);
  assert.equal(programPlan("memory").clickCycles, 2);
  assert.match(programStage("memory", -0.5, 120, 1), /Preparação · 1/);
  assert.match(programStage("memory", 0, 120, 1), /escutar/);
  assert.match(programStage("memory", 1, 120, 1), /com clique/);
  assert.match(programStage("memory", 2, 120, 1), /sem referência/);
  assert.equal(programStage("memory", 4, 120, 1), "Tomada concluída");
  assert.throws(() => programPlan("outro" as StudyProgram));
});
test("tomada finita tem quatro semínimas de entrada e exatamente quatro ciclos no PCM", () => {
  const playback = mixPlayback({
    pattern: toPattern("PDBD"),
    steps: 4,
    bpm: 120,
    subdivision: 4,
    guide: true,
    click: true,
    program: "steady",
  });
  assert.equal(playback.introDuration, 2);
  assert.equal(playback.targetDuration, 2);
  assert.equal(playback.logicalDuration, 4);
  assert.equal(playback.pcm.length, PLAYBACK_RATE * 4);
  assert.equal(playback.loop, false);
  assert.equal(playback.pcm.at(-1), 0);
  // Depois de cada clique de entrada não há cauda de pandeiro antes da execução.
  for (let pulse = 0; pulse < 4; pulse++) {
    const quiet = playback.pcm.slice(
      Math.round((pulse * 0.5 + 0.05) * PLAYBACK_RATE),
      Math.round((pulse * 0.5 + 0.45) * PLAYBACK_RATE),
    );
    assert.ok(quiet.every((v) => v === 0));
  }
});
test("memória silencia novos ataques de guia e clique nos ciclos especificados", () => {
  const common = {
    pattern: toPattern("P..............."),
    steps: 16,
    bpm: 100,
    subdivision: 4,
    guide: false,
    click: true,
  };
  const memory = mixPlayback({ ...common, program: "memory" });
  const silent = memory.pcm.slice(
    Math.round((memory.introDuration + 4.8 + 0.05) * PLAYBACK_RATE),
  );
  assert.ok(silent.every((v) => v === 0));
  const guide = mixPlayback({
    ...common,
    guide: true,
    click: false,
    program: "memory",
  });
  assert.ok(
    guide.pcm
      .slice(Math.round((guide.introDuration + 2.4) * PLAYBACK_RATE))
      .every((v) => v === 0),
  );
  assert.ok(
    guide.pcm
      .slice(
        Math.round(guide.introDuration * PLAYBACK_RATE),
        Math.round((guide.introDuration + 1) * PLAYBACK_RATE),
      )
      .some((v) => Math.abs(v) > 0.01),
  );
});
test("comparação detecta alteração de protocolo antes de interpretar diferenças de erro", () => {
  const a = makeRecord(
    ETUDES[1],
    settings,
    toPattern(ETUDES[1].sequence),
    [],
    4,
    "A",
  );
  const b = { ...a, id: "B", settings: { ...settings } };
  assert.equal(compareTakes(a, b).comparable, true);
  assert.equal(compareTakes(a, b).enough, false);
  const changed = {
    ...b,
    settings: {
      ...settings,
      bpm: 120,
      program: "memory" as const,
      meter: "2/4",
    },
  };
  assert.deepEqual(compareTakes(a, changed).differences, [
    "andamento",
    "métrica",
    "programa",
  ]);
  const explicit = {
    ...b,
    settings: { ...settings, sampleChoices: { grave: SOUND_BANK.grave[0].id } },
  };
  assert.equal(
    compareTakes(a, explicit).comparable,
    true,
    "seleção explícita da amostra padrão equivale à implícita",
  );
});
test("escritas pessoais conservam métrica e acentos, com rejeição de corrupção", () => {
  const rhythm = { ...ETUDES[1], origin: "custom" as const };
  const data = [{ id: "p1", createdAt: "2026-11-10T12:00:00Z", rhythm }];
  const result = parseProjects(JSON.stringify(data));
  assert.equal(result[0].rhythm.meter, "4/4");
  assert.equal(result[0].rhythm.origin, "custom");
  assert.notEqual(projectKey(rhythm), projectKey({ ...rhythm, accents: [1] }));
  assert.throws(() => parseProjects("{inválido"));
  assert.throws(() => parseProjects(JSON.stringify([...data, ...data])));
  assert.throws(() =>
    parseProjects(
      JSON.stringify([{ ...data[0], rhythm: { ...rhythm, meter: "6/8" } }]),
    ),
  );
});
test("perguntas de escuta sorteiam arquivos existentes dentro do par declarado", () => {
  for (let pair = 0; pair < LISTENING_PAIRS.length; pair++)
    for (const random of [0, 0.49, 0.5, 0.99, 1]) {
      const question = listeningQuestion(pair, () => random);
      assert.ok(LISTENING_PAIRS[pair].codes.includes(question.code));
      assert.ok(
        SOUND_BANK[question.kind].some(
          (sample) => sample.id === question.sampleId,
        ),
      );
    }
  assert.throws(() => listeningQuestion(99));
});
