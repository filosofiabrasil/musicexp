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
  running = false;
  ready = false;

  async prepare(config: PlaybackConfig) {
    this.dispose();
    this.buffer = bufferFromPcm(mixCycle(config));
    this.durationScale = barDuration(config.bpm, config.steps, config.subdivision) / this.buffer.duration;
    this.ready = true;
  }
  async start() {
    if (!this.ready || !this.buffer) throw new Error("O áudio ainda está sendo preparado.");
    if (this.running) return;
    const ctx = audioContext();
    if (ctx.state !== "running") await ctx.resume();
    // Uma preparação posterior pode ter invalidado a sessão durante o resume.
    if (!this.ready || !this.buffer) return;
    const source = ctx.createBufferSource();
    source.buffer = this.buffer;
    source.loop = true;
    source.loopStart = 0;
    source.loopEnd = this.buffer.duration;
    source.connect(ctx.destination);
    this.startedAt = ctx.currentTime;
    source.start(this.startedAt, (this.elapsed / this.durationScale) % this.buffer.duration);
    this.source = source;
    this.running = true;
  }
  getTime = () => this.elapsed + (this.running ? Math.max(0, audioContext().currentTime - this.startedAt) * this.durationScale : 0);
  pause() {
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
  prepare() {
    for (const [kind, pcm] of Object.entries(kit.samples)) this.buffers.set(kind as Kind, bufferFromPcm(decodePcm16(pcm)));
  }
  play(kind: Kind) {
    const buffer = this.buffers.get(kind);
    if (!buffer) return;
    const ctx = audioContext();
    const play = () => {
      if (!this.buffers.has(kind)) return;
      const voice = ctx.createBufferSource();
      voice.buffer = buffer;
      voice.connect(ctx.destination);
      this.voices.add(voice);
      voice.onended = () => { voice.disconnect(); this.voices.delete(voice); };
      voice.start();
    };
    if (ctx.state === "running") play();
    else void ctx.resume().then(play);
  }
  dispose() {
    for (const voice of this.voices) { voice.onended = null; voice.stop(); voice.disconnect(); }
    this.voices.clear();
    this.buffers.clear();
  }
}
