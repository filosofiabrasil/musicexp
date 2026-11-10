import { DetectedHit, Pattern, stepDuration } from "../pandeiro-ui-base/types";

export function nearestNominal(t: number, bpm: number, subdivision: number) {
  const duration = stepDuration(bpm, subdivision);
  return Math.round(t / duration) * duration;
}
export function clockPosition(
  t: number,
  bpm: number,
  steps: number,
  subdivision = 4,
) {
  const stepDur = stepDuration(bpm, subdivision),
    bar = stepDur * steps;
  const totalSteps = Math.max(0, t) / stepDur;
  const barIndex = Math.floor(totalSteps / steps + 1e-10);
  const position = Math.max(0, totalSteps - barIndex * steps),
    phase = position / steps;
  return {
    t,
    phase,
    step: Math.min(steps - 1, Math.floor(position + 1e-9)),
    bar,
    barStart: barIndex * bar,
    barIndex,
    stepDur,
  };
}
/** Acertos únicos por posição; repetição, golpe errado e pausa não pontuam. */
export function sessionMetrics(
  hits: DetectedHit[],
  pattern: Pattern,
  steps: number,
  bpm: number,
  subdivision: number,
  tolerance: number,
  now: number,
) {
  const dt = stepDuration(bpm, subdivision);
  const completeSteps = Math.floor(Math.max(0, now) / dt + 1e-9);
  const fullCycles = Math.floor(completeSteps / steps);
  let expected = fullCycles * Object.keys(pattern).length;
  for (let i = 0; i < completeSteps % steps; i++) if (pattern[i]) expected++;
  const correct = new Set<number>();
  const errors = hits.map((h) => (h.t - h.nominal) * 1000);
  for (const h of hits) {
    const slot = Math.round(h.nominal / dt);
    if (
      slot >= 0 &&
      slot < completeSteps &&
      pattern[slot % steps] === h.kind &&
      Math.abs(h.t - h.nominal) * 1000 <= tolerance
    )
      correct.add(slot);
  }
  const mean = errors.length
    ? errors.reduce((a, b) => a + b, 0) / errors.length
    : 0;
  const mae = errors.length
    ? errors.reduce((a, b) => a + Math.abs(b), 0) / errors.length
    : 0;
  const std = errors.length
    ? Math.sqrt(errors.reduce((a, b) => a + (b - mean) ** 2, 0) / errors.length)
    : 0;
  return {
    expected,
    correct: correct.size,
    mae,
    mean,
    std,
    count: hits.length,
    accuracy: expected ? Math.round((correct.size / expected) * 100) : null,
  };
}
