import assert from "node:assert/strict";
import test from "node:test";
import {
  nearestNominal,
  clockPosition,
  sessionMetrics,
  bestStepHit,
  withinTolerance,
} from "../src/audio/timing";
import {
  barDuration,
  toPattern,
  type DetectedHit,
} from "../src/pandeiro-ui-base/types";
import rhythms from "../src/data/rhythms.json";
import padbt from "../src/data/ritmos-PADBT.json";

test("preserva os 148 ritmos, as 75 entradas PADBT e os ciclos irregulares", () => {
  assert.equal(rhythms.length, 148);
  assert.equal(rhythms.filter((r) => r.padbt).length, 75);
  assert.equal(new Set(rhythms.map((r) => r.id)).size, 148);
  for (const basic of padbt.ritmos) {
    const full = rhythms.find((r) => r.id === basic.id)!;
    assert.equal(full.sequence, basic.golpes);
    assert.equal(full.subdivision, basic.sub);
  }
  for (const length of [6, 7, 8, 9, 10, 12, 16, 24, 32])
    assert.ok(rhythms.some((r) => r.sequence.length === length));
  for (const r of rhythms)
    assert.ok(r.sources.length && /^[PADBTXQMR.]+$/.test(r.sequence));
});
test("a duração usa BPM, ciclo e subdivisão, inclusive sextinas", () => {
  assert.equal(barDuration(120, 16), 2);
  assert.equal(barDuration(120, 7), 0.875);
  assert.equal(barDuration(120, 24, 6), 2);
  const clock = clockPosition(1, 120, 7);
  assert.equal(clock.barIndex, 1);
  assert.equal(clock.step, 1);
  assert.equal(clock.barStart, 0.875);
});
test("a grade reconhece adiantamento na virada sem prender o golpe ao ciclo anterior", () => {
  assert.equal(nearestNominal(0.99, 120, 4), 1);
  assert.equal(nearestNominal(1.02, 120, 4), 1);
});
test("pausas, golpe errado, erros acima da tolerância e duplicações não aumentam a pontuação", () => {
  const pattern = toPattern("P.DT");
  const hits: DetectedHit[] = [
    { t: 0, nominal: 0, kind: "grave" },
    { t: 0.01, nominal: 0, kind: "grave" },
    { t: 0.125, nominal: 0.125, kind: "dedos" },
    { t: 0.25, nominal: 0.25, kind: "tapa" },
    { t: 0.4, nominal: 0.375, kind: "tapa" },
  ];
  const metrics = sessionMetrics(hits, pattern, 4, 120, 4, 15, 0.5);
  assert.equal(metrics.expected, 3);
  assert.equal(metrics.correct, 1);
  assert.equal(metrics.accuracy, 33);
  assert.ok(metrics.mae > 0 && metrics.std > 0);
});
test("o erro médio mantém o sinal e o absoluto tem a unidade correta", () => {
  const hits: DetectedHit[] = [
    { t: 0.49, nominal: 0.5, kind: "grave" },
    { t: 0.77, nominal: 0.75, kind: "dedos" },
  ];
  const m = sessionMetrics(hits, toPattern("PD"), 2, 120, 4, 25, 1);
  assert.ok(Math.abs(m.mae - 15) < 0.001);
  assert.ok(Math.abs(m.mean - 5) < 0.001);
  assert.ok(Math.abs(m.std - 15) < 0.001);
});

test("o limite inclusivo de 15 ms não perde acertos por arredondamento binário", () => {
  for (const t of [0.485, 0.515]) {
    const metrics = sessionMetrics(
      [{ t, nominal: 0.5, kind: "grave" }],
      toPattern("P"),
      1,
      120,
      4,
      15,
      1,
    );
    assert.equal(metrics.correct, 1, String(t));
  }
  assert.equal(withinTolerance(15.0001, 15), false);
});

test("as barras mostram o golpe correto quando outro timbre veio antes na mesma posição", () => {
  const hits: DetectedHit[] = [
    { t: 0.5, nominal: 0.5, kind: "tapa" },
    { t: 0.51, nominal: 0.5, kind: "grave" },
  ];
  assert.equal(bestStepHit(hits, 0.5, "grave", 0.52, 15)?.kind, "grave");
  assert.equal(bestStepHit(hits, 0.5, "grave", 0.505, 15)?.kind, "tapa");
});
