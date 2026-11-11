import { Kind, Pattern, stepDuration } from "../pandeiro-ui-base/types";
import {
  ClickMode,
  SampleChoices,
  defaultGroups,
  groupStarts,
} from "../music/score";
import { PLAYBACK_RATE, soundPcm } from "./sampleLibrary";
import { StudyProgram, programPlan } from "../music/program";

export type PlaybackConfig = {
  pattern: Pattern;
  steps: number;
  bpm: number;
  subdivision: number;
  guide: boolean;
  click: boolean;
  clickMode?: ClickMode;
  groups?: number[];
  accents?: number[];
  dynamicGain?: number;
  samples?: SampleChoices;
  program?: StudyProgram;
};
const gain: Record<Kind, number> = {
  grave: 0.9,
  abafado: 0.8,
  graveDedos: 0.85,
  tapa: 0.8,
  tapaPolegar: 0.8,
  punho: 0.75,
  dedos: 0.6,
  medio: 0.7,
  rulo: 0.7,
};
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);

export function playbackSteps(config: PlaybackConfig) {
  const { steps, bpm, subdivision } = config;
  if (
    !Number.isInteger(steps) ||
    steps < 1 ||
    steps > 32 ||
    !Number.isFinite(bpm) ||
    bpm < 30 ||
    bpm > 240 ||
    ![2, 3, 4, 6, 8].includes(subdivision)
  )
    throw new Error("Grade de reprodução inválida.");
  // O pulso de semínima não reinicia artificialmente em ciclos de 7, 9 etc.
  return config.click && config.clickMode !== "groups"
    ? (steps / gcd(steps, subdivision)) * subdivision
    : steps;
}
export function clickPositions(
  config: PlaybackConfig,
  span = playbackSteps(config),
) {
  if (!config.click) return [];
  const mode = config.clickMode ?? "pulse";
  const boundaries = groupStarts(
    config.groups ?? defaultGroups(config.steps, config.subdivision),
  );
  return Array.from({ length: span }, (_, i) => i).filter(
    (i) =>
      mode === "subdivision" ||
      (mode === "groups"
        ? boundaries.includes(i % config.steps)
        : i % config.subdivision === 0),
  );
}
function render(config: PlaybackConfig, span: number, wrap = true) {
  const frames = Math.round(
    stepDuration(config.bpm, config.subdivision) * span * PLAYBACK_RATE,
  );
  const output = new Float32Array(frames);
  const dynamics = Math.max(0, Math.min(1, config.dynamicGain ?? 0.7));
  const clicks = new Set(clickPositions(config, span));
  const mode = config.clickMode ?? "pulse";
  const plan = programPlan(config.program ?? "free");
  for (let i = 0; i < span; i++) {
    const slot = i % config.steps,
      kind = config.pattern[slot],
      offset = Math.round((i / span) * frames);
    if (
      config.guide &&
      kind &&
      Math.floor(i / config.steps) < plan.guideCycles
    ) {
      const emphasis = config.accents?.includes(slot) ? 1.25 : 1;
      soundPcm(kind, config.samples?.[kind]).forEach((value, j) => {
        const at = wrap ? (offset + j) % frames : offset + j;
        if (at < frames)
          output[at] += value * gain[kind] * dynamics * 0.75 * emphasis;
      });
    }
    if (clicks.has(i) && Math.floor(i / config.steps) < plan.clickCycles) {
      const accented =
        mode === "groups"
          ? slot === 0
          : mode === "subdivision" && i % config.subdivision === 0;
      for (let j = 0; j < PLAYBACK_RATE * 0.025; j++) {
        const at = wrap ? (offset + j) % frames : offset + j;
        if (at < frames)
          output[at] +=
            0.18 *
            Math.sin(
              (2 * Math.PI * (accented ? 2200 : 1500) * j) / PLAYBACK_RATE,
            ) *
            Math.exp(-j / (PLAYBACK_RATE * 0.006));
      }
    }
  }
  return output.map((value) => Math.tanh(value));
}
/** Um ciclo da escrita, usado para inspeção/exportação. */
export function mixCycle(config: PlaybackConfig) {
  playbackSteps(config);
  return render(config, config.steps);
}
/** O buffer pode conter vários ciclos para manter o metrônomo regular. */
export function mixPlayback(config: PlaybackConfig) {
  const regularSpan = playbackSteps(config);
  const plan = programPlan(config.program ?? "free");
  const span = plan.cycles ? config.steps * plan.cycles : regularSpan;
  const introDuration = (plan.countIn * 60) / config.bpm;
  const body = render(config, span, !plan.cycles);
  const introFrames = Math.round(introDuration * PLAYBACK_RATE);
  const pcm = new Float32Array(introFrames + body.length);
  pcm.set(body, introFrames);
  for (let pulse = 0; pulse < plan.countIn; pulse++) {
    const offset = Math.round(((pulse * 60) / config.bpm) * PLAYBACK_RATE);
    for (let j = 0; j < PLAYBACK_RATE * 0.025 && offset + j < introFrames; j++)
      pcm[offset + j] = Math.tanh(
        0.18 *
          Math.sin(
            (2 * Math.PI * (pulse === 0 ? 2200 : 1500) * j) / PLAYBACK_RATE,
          ) *
          Math.exp(-j / (PLAYBACK_RATE * 0.006)),
      );
  }
  if (plan.cycles)
    for (let j = 0; j < Math.min(529, pcm.length); j++)
      pcm[pcm.length - 1 - j] *= j / 529;
  const bodyDuration = stepDuration(config.bpm, config.subdivision) * span;
  return {
    pcm,
    logicalDuration: introDuration + bodyDuration,
    repetitions: span / config.steps,
    introDuration,
    loop: !plan.cycles,
    targetDuration: plan.cycles ? bodyDuration : null,
  };
}
