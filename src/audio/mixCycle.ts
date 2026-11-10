import { Kind, Pattern, barDuration } from "../pandeiro-ui-base/types";
import kit from "../data/kit.json";
import { decodePcm16 } from "./pcm";

export type PlaybackConfig = {
  pattern: Pattern;
  steps: number;
  bpm: number;
  subdivision: number;
  guide: boolean;
  click: boolean;
};
const samples = Object.fromEntries(
  Object.entries(kit.samples).map(([kind, pcm]) => [kind, decodePcm16(pcm)]),
) as Record<Kind, Float32Array>;
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
export function mixCycle(config: PlaybackConfig): Float32Array {
  const { steps, bpm, subdivision, pattern, guide, click } = config;
  const duration = barDuration(bpm, steps, subdivision),
    frames = Math.round(duration * kit.rate);
  const output = new Float32Array(frames);
  for (let i = 0; i < steps; i++) {
    const offset = Math.round((i / steps) * frames),
      kind = pattern[i];
    if (guide && kind)
      samples[kind].forEach((v, j) => {
        output[(offset + j) % frames] += v * gain[kind] * 0.6;
      });
    if (click && i % subdivision === 0) {
      for (let j = 0; j < kit.rate * 0.025; j++)
        output[(offset + j) % frames] +=
          0.22 *
          Math.sin((2 * Math.PI * (i ? 1500 : 2200) * j) / kit.rate) *
          Math.exp(-j / (kit.rate * 0.006));
    }
  }
  // Soft limit para somar caudas sem recortar o ataque.
  return output.map((v) => Math.tanh(v));
}

