import { Kind } from "../pandeiro-ui-base/types";
import { mixPlayback, PlaybackConfig } from "./mixCycle";
export { mixCycle, PlaybackConfig } from "./mixCycle";
import { PLAYBACK_RATE, soundPcm, soundVariant } from "./sampleLibrary";
import { SampleChoices } from "../music/score";
import { CODES, STROKES } from "../pandeiro-ui-base/types";

let context: AudioContext | null = null;
function audioContext() {
  if (!context || context.state === "closed") {
    context = new AudioContext({ latencyHint: "interactive" });
  }
  return context;
}
function bufferFromPcm(pcm: Float32Array) {
  const buffer = audioContext().createBuffer(1, pcm.length, PLAYBACK_RATE);
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
  private output: GainNode | null = null;
  private volume = 1;
  private intro = 0;
  private looping = true;
  private target: number | null = null;
  finished = false;
  onFinish?: () => void;
  running = false;
  ready = false;

  async prepare(config: PlaybackConfig) {
    return this.prepareRendered(mixPlayback(config));
  }
  async prepareRendered(playback: ReturnType<typeof mixPlayback>) {
    this.dispose();
    this.buffer = bufferFromPcm(playback.pcm);
    this.durationScale = playback.logicalDuration / this.buffer.duration;
    this.intro = playback.introDuration;
    this.looping = playback.loop;
    this.target = playback.targetDuration;
    this.finished = false;
    this.output = audioContext().createGain();
    this.output.gain.value = this.volume;
    this.output.connect(audioContext().destination);
    this.ready = true;
  }
  start(): Promise<boolean> {
    if (this.running) return Promise.resolve(true);
    if (this.starting) return this.starting;
    if (!this.ready || !this.buffer)
      return Promise.reject(new Error("O áudio ainda está sendo preparado."));
    if (this.finished) return Promise.resolve(false);
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
      source.loop = this.looping;
      source.loopStart = this.intro / this.durationScale;
      source.loopEnd = buffer.duration;
      source.connect(this.output ?? ctx.destination);
      this.startedAt = ctx.currentTime;
      const bodyDuration = buffer.duration - source.loopStart;
      const position = this.elapsed / this.durationScale;
      source.onended = () => {
        if (this.source !== source || this.looping) return;
        this.elapsed = (this.target ?? 0) + this.intro;
        this.finished = true;
        this.running = false;
        source.disconnect();
        this.source = null;
        this.onFinish?.();
      };
      source.start(
        this.startedAt,
        this.looping && position >= source.loopStart
          ? source.loopStart + ((position - source.loopStart) % bodyDuration)
          : position,
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
  setVolume(value: number) {
    this.volume = Math.max(0, Math.min(1, value));
    if (this.output) this.output.gain.value = this.volume;
  }
  private rawTime = () =>
    this.elapsed +
    (this.running
      ? Math.max(0, audioContext().currentTime - this.startedAt) *
        this.durationScale
      : 0);
  getTime = () => {
    const time = this.rawTime() - this.intro;
    return this.target === null ? time : Math.min(time, this.target);
  };
  pause() {
    this.generation++;
    this.starting = null;
    this.elapsed = this.rawTime();
    if (this.target !== null && this.elapsed >= this.intro + this.target - 1e-8)
      this.finished = true;
    this.running = false;
    if (this.source) this.source.onended = null;
    this.source?.stop();
    this.source?.disconnect();
    this.source = null;
  }
  dispose() {
    this.pause();
    this.output?.disconnect();
    this.output = null;
    this.buffer = null;
    this.elapsed = 0;
    this.intro = 0;
    this.target = null;
    this.finished = false;
    this.ready = false;
  }
}

export class PadSounds {
  private buffers = new Map<string, AudioBuffer>();
  private voices = new Set<AudioBufferSourceNode>();
  private generation = 0;
  private output: GainNode | null = null;
  private volume = 1;
  prepare(choices: SampleChoices = {}) {
    this.dispose();
    this.output = audioContext().createGain();
    this.output.gain.value = this.volume;
    this.output.connect(audioContext().destination);
    for (const code of CODES) {
      const kind = STROKES[code].kind,
        variant = soundVariant(kind, choices[kind]);
      this.buffers.set(variant.id, bufferFromPcm(soundPcm(kind, variant.id)));
    }
  }
  setVolume(value: number) {
    this.volume = Math.max(0, Math.min(1, value));
    if (this.output) this.output.gain.value = this.volume;
  }
  async play(kind: Kind, variantId?: string) {
    const variant = soundVariant(kind, variantId);
    if (!this.buffers.has(variant.id))
      this.buffers.set(variant.id, bufferFromPcm(soundPcm(kind, variant.id)));
    const buffer = this.buffers.get(variant.id)!;
    const generation = this.generation,
      ctx = audioContext();
    if (ctx.state !== "running") await ctx.resume();
    if (generation !== this.generation || !this.output) return false;
    const voice = ctx.createBufferSource();
    voice.buffer = buffer;
    voice.connect(this.output);
    this.voices.add(voice);
    voice.onended = () => {
      voice.disconnect();
      this.voices.delete(voice);
    };
    voice.start();
    return true;
  }
  silence() {
    this.generation++;
    for (const voice of this.voices) {
      voice.onended = null;
      voice.stop();
      voice.disconnect();
    }
    this.voices.clear();
  }
  dispose() {
    this.silence();
    this.buffers.clear();
    this.output?.disconnect();
    this.output = null;
  }
}
