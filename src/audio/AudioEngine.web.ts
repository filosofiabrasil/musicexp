import { Kind, barDuration } from "../pandeiro-ui-base/types";
import kit from "../data/kit.json";
import { decodePcm16 } from "./pcm";
import { mixCycle, PlaybackConfig } from "./mixCycle";
export { mixCycle, PlaybackConfig } from "./mixCycle";

let context: AudioContext | null = null;
function audioContext() {
  if (!context || context.state === "closed") {
    context = new AudioContext({ latencyHint: "interactive" });
  }
  return context;
}
function bufferFromPcm(pcm: Float32Array) {
  const buffer = audioContext().createBuffer(1, pcm.length, kit.rate);
  buffer.copyToChannel(new Float32Array(pcm), 0);
  return buffer;
}

/** AudioBufferSourceNode repete os frames sem reabrir/ressincronizar uma mídia HTML. */
export class AudioEngine {
  private buffer: AudioBuffer | null = null;
  private source: AudioBufferSourceNode | null = null;
  private startedAt = 0;
  private elapsed = 0;
  private durationScale = 1;
  private generation = 0;
  private starting: Promise<boolean> | null = null;
  running = false;
  ready = false;

  async prepare(config: PlaybackConfig) {
    this.dispose();
    this.buffer = bufferFromPcm(mixCycle(config));
    this.durationScale =
      barDuration(config.bpm, config.steps, config.subdivision) /
      this.buffer.duration;
    this.ready = true;
  }
  start(): Promise<boolean> {
    if (this.running) return Promise.resolve(true);
    if (this.starting) return this.starting;
    if (!this.ready || !this.buffer)
      return Promise.reject(new Error("O áudio ainda está sendo preparado."));
    const generation = this.generation;
    const buffer = this.buffer;
    const ctx = audioContext();
    const pending = (async () => {
      if (ctx.state !== "running") await ctx.resume();
      if (
        generation !== this.generation ||
        !this.ready ||
        buffer !== this.buffer
      )
        return false;
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.loopStart = 0;
      source.loopEnd = buffer.duration;
      source.connect(ctx.destination);
      this.startedAt = ctx.currentTime;
      source.start(
        this.startedAt,
        (this.elapsed / this.durationScale) % buffer.duration,
      );
      this.source = source;
      this.running = true;
      return true;
    })();
    this.starting = pending;
    const clear = () => {
      if (this.starting === pending) this.starting = null;
    };
    void pending.then(clear, clear);
    return pending;
  }
  getTime = () =>
    this.elapsed +
    (this.running
      ? Math.max(0, audioContext().currentTime - this.startedAt) *
        this.durationScale
      : 0);
  pause() {
    this.generation++;
    this.starting = null;
    this.elapsed = this.getTime();
    this.running = false;
    this.source?.stop();
    this.source?.disconnect();
    this.source = null;
  }
  dispose() {
    this.pause();
    this.buffer = null;
    this.elapsed = 0;
    this.ready = false;
  }
}

export class PadSounds {
  private buffers = new Map<Kind, AudioBuffer>();
  private voices = new Set<AudioBufferSourceNode>();
  private generation = 0;
  prepare() {
    this.dispose();
    for (const [kind, pcm] of Object.entries(kit.samples))
      this.buffers.set(kind as Kind, bufferFromPcm(decodePcm16(pcm)));
  }
  async play(kind: Kind) {
    const buffer = this.buffers.get(kind);
    if (!buffer) return;
    const generation = this.generation;
    const ctx = audioContext();
    if (ctx.state !== "running") await ctx.resume();
    if (generation !== this.generation || !this.buffers.has(kind)) return;
    const voice = ctx.createBufferSource();
    voice.buffer = buffer;
    voice.connect(ctx.destination);
    this.voices.add(voice);
    voice.onended = () => {
      voice.disconnect();
      this.voices.delete(voice);
    };
    voice.start();
  }
  dispose() {
    this.generation++;
    for (const voice of this.voices) {
      voice.onended = null;
      voice.stop();
      voice.disconnect();
    }
    this.voices.clear();
    this.buffers.clear();
  }
}
