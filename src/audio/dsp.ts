import { CODES, Kind, STROKES } from "../pandeiro-ui-base/types";

export type TemplateBank = Partial<Record<Kind, number[][]>>;
export type Onset = { time: number; features: number[]; rms: number };
/** Características relativas de timbre, calculadas igualmente no treino e na captura. */
export function extractFeatures(
  pcm: ArrayLike<number>,
  sampleRate: number,
): number[] {
  const length = Math.min(pcm.length, Math.round(sampleRate * 0.04));
  const frequencies = [
    90, 150, 240, 380, 600, 950, 1500, 2300, 3400, 4800, 6500,
  ];
  const power = frequencies.map((f) => {
    const coefficient = 2 * Math.cos((2 * Math.PI * f) / sampleRate);
    let a = 0,
      b = 0;
    for (let i = 0; i < length; i++) {
      const value =
        pcm[i] *
        (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / Math.max(1, length - 1)));
      const c = value + coefficient * a - b;
      b = a;
      a = c;
    }
    return Math.max(0, a * a + b * b - coefficient * a * b);
  });
  const total = power.reduce((a, b) => a + b, 0) + 1e-12;
  let crossings = 0;
  for (let i = 1; i < length; i++)
    if (pcm[i] >= 0 !== pcm[i - 1] >= 0) crossings++;
  return [
    ...power.map((p) => Math.log10(p / total + 0.0001) / 4),
    // As referências usam 16 kHz; browsers capturam normalmente em 44,1/48 kHz.
    (crossings / Math.max(1, length)) * (sampleRate / 16000),
  ];
}
export function classify(features: number[], bank: TemplateBank) {
  const ranked = CODES.flatMap((code) => {
    const kind = STROKES[code].kind,
      templates = bank[kind];
    if (!templates?.length) return [];
    const distance = Math.min(
      ...templates.map((t) =>
        Math.sqrt(
          t.reduce((sum, v, i) => sum + (v - features[i]) ** 2, 0) / t.length,
        ),
      ),
    );
    return [{ kind, distance }];
  }).sort((a, b) => a.distance - b.distance);
  const best = ranked[0],
    second = ranked[1];
  if (!best) return null;
  const margin = second
    ? Math.max(0, (second.distance - best.distance) / (second.distance + 0.005))
    : 1;
  const confidence = Math.min(
    1,
    Math.max(0, (1 - best.distance / 0.35) * 0.6 + margin * 0.4),
  );
  return {
    ...best,
    confidence,
    accepted: best.distance < 0.3 && confidence >= 0.35 && margin >= 0.04,
  };
}

/** Envelope de 2 ms, limiar adaptativo e janela de timbre de 40 ms.
 * O timestamp é o início do ataque no PCM, não a chegada do callback. */
export class OnsetDetector {
  private frame: number[] = [];
  private frameTime = 0;
  private noise = 0.001;
  private previous = 0.001;
  private lastOnset = -Infinity;
  private pending: { time: number; pcm: number[]; rms: number } | null = null;
  threshold = 0.008;
  constructor(private emit: (onset: Onset) => void) {}
  reset() {
    this.frame = [];
    this.pending = null;
    this.noise = 0.001;
    this.previous = 0.001;
    this.lastOnset = -Infinity;
  }
  process(pcm: Float32Array, rate: number, startTime: number) {
    const frameSize = Math.max(1, Math.round(rate * 0.002));
    const captureSize = Math.round(rate * 0.04);
    for (let i = 0; i < pcm.length; i++) {
      if (this.pending) {
        this.pending.pcm.push(pcm[i]);
        if (this.pending.pcm.length >= captureSize) {
          const pending = this.pending;
          this.pending = null;
          this.emit({
            time: pending.time,
            features: extractFeatures(pending.pcm, rate),
            rms: pending.rms,
          });
        }
      }
      if (!this.frame.length) this.frameTime = startTime + i / rate;
      this.frame.push(pcm[i]);
      if (this.frame.length < frameSize) continue;
      const rms = Math.sqrt(
        this.frame.reduce((s, x) => s + x * x, 0) / frameSize,
      );
      const limit = Math.max(this.threshold, this.noise * 4);
      if (
        rms > limit &&
        rms > this.previous * 1.8 &&
        this.frameTime - this.lastOnset > 0.065 &&
        !this.pending
      ) {
        this.lastOnset = this.frameTime;
        this.pending = { time: this.frameTime, pcm: [...this.frame], rms };
      }
      if (rms < limit) this.noise = 0.99 * this.noise + 0.01 * rms;
      this.previous = Math.max(0.0001, rms);
      this.frame = [];
    }
  }
}
