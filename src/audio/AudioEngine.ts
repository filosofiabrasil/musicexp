import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from "expo-audio";
import { Kind, Pattern, barDuration } from "../pandeiro-ui-base/types";
import kit from "../data/kit.json";
import { decodePcm16, wavBytes } from "./pcm";
import { wavSource } from "./wavSource";

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

/** Um WAV por ciclo: o agendamento está nos frames de áudio, sem setInterval. */
export class AudioEngine {
  private player: AudioPlayer | null = null;
  private disposeSource: (() => void) | null = null;
  private cycles = 0;
  private previous = 0;
  private duration = 1;
  private actualDuration = 1;
  private generation = 0;
  running = false;
  ready = false;
  async prepare(config: PlaybackConfig) {
    const generation = ++this.generation;
    this.releasePlayer();
    this.ready = false;
    this.cycles = 0;
    this.previous = 0;
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
    });
    const pcm = mixCycle(config);
    const source = await wavSource(wavBytes(pcm, kit.rate));
    if (generation !== this.generation) {
      source.dispose();
      return;
    }
    const player = createAudioPlayer(
      { uri: source.uri },
      { updateInterval: 16 },
    );
    this.player = player;
    this.disposeSource = source.dispose;
    this.duration = barDuration(config.bpm, config.steps, config.subdivision);
    this.actualDuration = pcm.length / kit.rate;
    player.loop = true;
    await new Promise<void>((resolve, reject) => {
      if (player.isLoaded) {
        resolve();
        return;
      }
      const timer = setTimeout(() => {
        subscription.remove();
        reject(
          new Error("Não foi possível carregar o áudio. Tente reiniciar."),
        );
      }, 12000);
      const subscription = player.addListener(
        "playbackStatusUpdate",
        (status) => {
          if (status.isLoaded) {
            clearTimeout(timer);
            subscription.remove();
            resolve();
          }
        },
      );
    });
    if (generation === this.generation) this.ready = true;
  }
  async start() {
    if (!this.player || !this.ready)
      throw new Error("O áudio ainda está sendo preparado.");
    const result = this.player.play() as unknown;
    if (result instanceof Promise) await result;
    this.running = true;
  }
  pause() {
    this.getTime();
    this.player?.pause();
    this.running = false;
  }
  getTime = () => {
    if (!this.player) return 0;
    const position = this.player.currentTime;
    if (position < this.previous - this.actualDuration * 0.5) this.cycles++;
    this.previous = position;
    return (this.cycles + position / this.actualDuration) * this.duration;
  };
  private releasePlayer() {
    this.running = false;
    this.player?.pause();
    this.player?.remove();
    this.player = null;
    this.disposeSource?.();
    this.disposeSource = null;
  }
  dispose() {
    this.generation++;
    this.releasePlayer();
    this.ready = false;
  }
}

const soundFiles: Record<Kind, number> = {
  grave: require("../../assets/kit/grave.wav"),
  abafado: require("../../assets/kit/abafado.wav"),
  dedos: require("../../assets/kit/dedos.wav"),
  punho: require("../../assets/kit/punho.wav"),
  tapa: require("../../assets/kit/tapa.wav"),
  tapaPolegar: require("../../assets/kit/tapaPolegar.wav"),
  graveDedos: require("../../assets/kit/graveDedos.wav"),
  medio: require("../../assets/kit/medio.wav"),
  rulo: require("../../assets/kit/rulo.wav"),
};
export class PadSounds {
  private players = new Map<Kind, AudioPlayer[]>();
  private index = new Map<Kind, number>();
  prepare() {
    Object.entries(soundFiles).forEach(([kind, asset]) => {
      this.players.set(kind as Kind, [
        createAudioPlayer(asset),
        createAudioPlayer(asset),
      ]);
    });
  }
  play(kind: Kind) {
    const pool = this.players.get(kind);
    if (!pool) return;
    const index = (this.index.get(kind) || 0) % pool.length;
    this.index.set(kind, index + 1);
    const player = pool[index];
    void player.seekTo(0).then(() => player.play());
  }
  dispose() {
    this.players.forEach((pool) => pool.forEach((player) => player.remove()));
    this.players.clear();
  }
}
