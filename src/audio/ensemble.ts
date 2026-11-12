import { decodePcm16 } from "./pcm";
import {
  EnsembleScene,
  clipById,
  phrasePlan,
  ENSEMBLE_RATE,
} from "../music/ensemble";
const cache = new Map<string, Float32Array>();
export function ensemblePcm(id: string) {
  if (!cache.has(id)) cache.set(id, decodePcm16(clipById(id).pcm));
  return cache.get(id)!;
}
export function renderEnsemble(scene: EnsembleScene) {
  const plan = phrasePlan(scene),
    rate = ENSEMBLE_RATE;
  const frame = (beat: number) => Math.round(((beat * 60) / scene.bpm) * rate);
  const introFrames = scene.countIn ? frame(4) : 0,
    bodyFrames = frame(plan.beats);
  const pcm = new Float32Array(introFrames + bodyFrames);
  const events: {
    clipId: string;
    beat: number;
    frame: number;
    gain: number;
  }[] = [];
  const add = (id: string, beat: number, gain: number) => {
    if (!gain) return;
    const sound = ensemblePcm(id),
      at = introFrames + frame(beat);
    for (let i = 0; i < sound.length && at + i < pcm.length; i++)
      pcm[at + i] += sound[i] * gain;
    events.push({ clipId: id, beat, frame: at, gain });
  };
  for (const instrument of (scene.bpm === 84
    ? ["surdo"]
    : ["surdo", "agogo", "reco"]) as ("surdo" | "agogo" | "reco")[]) {
    const id = `${instrument}${scene.bpm}`,
      clip = clipById(id);
    for (let beat = 0; beat < plan.beats; beat += clip.beats)
      add(id, beat, scene.levels[instrument]);
  }
  const model = scene.mode === "chair" ? scene.chairGuide : scene.dominoGuide;
  if (model)
    for (const cue of plan.cues)
      add(cue.clipId, cue.startBeat, scene.levels.pandeiro);
  const beep = (at: number, strong: boolean) => {
    for (let j = 0; j < 1103 && at + j < pcm.length; j++)
      pcm[at + j] +=
        0.15 *
        Math.sin((2 * Math.PI * (strong ? 2200 : 1500) * j) / rate) *
        Math.exp(-j / (rate * 0.006));
  };
  if (scene.countIn)
    for (let beat = 0; beat < 4; beat++) beep(frame(beat), beat === 0);
  if (scene.click)
    for (let beat = 0; beat < plan.beats; beat++)
      beep(introFrames + frame(beat), beat % 4 === 0);
  // Finite takes end on the shared timeline, with a short release inside it.
  for (let j = 0; j < Math.min(441, pcm.length); j++)
    pcm[pcm.length - 1 - j] *= j / 441;
  let peak = 0;
  for (const v of pcm) peak = Math.max(peak, Math.abs(v));
  const gain = peak > 0.96 ? 0.96 / peak : 1;
  if (gain !== 1) for (let i = 0; i < pcm.length; i++) pcm[i] *= gain;
  return {
    pcm,
    logicalDuration: pcm.length / rate,
    introDuration: introFrames / rate,
    loop: false,
    targetDuration: bodyFrames / rate,
    repetitions: 1,
    cues: plan.cues,
    beats: plan.beats,
    events,
    masterGain: gain,
  };
}
