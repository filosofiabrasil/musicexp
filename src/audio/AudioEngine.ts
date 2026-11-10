import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from "expo-audio";
import { Kind, barDuration } from "../pandeiro-ui-base/types";
import kit from "../data/kit.json";
import { wavBytes } from "./pcm";
import { wavSource } from "./wavSource";
import { mixCycle, PlaybackConfig } from "./mixCycle";
import { waitForAudioLoad } from "./waitForAudioLoad";
export { mixCycle, PlaybackConfig } from "./mixCycle";

/** Um WAV por ciclo: o agendamento está nos frames de áudio, sem setInterval. */
export class AudioEngine {
  private player: AudioPlayer | null = null;
  private disposeSource: (() => void) | null = null;
  private cycles = 0;
  private previous = 0;
  private duration = 1;
  private actualDuration = 1;
  private generation = 0;
  private startRevision = 0;
  private cancelLoad: (() => void) | null = null;
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
    const load = waitForAudioLoad(player);
    this.cancelLoad = load.cancel;
    try {
      const loaded = await load.promise;
      if (loaded && generation === this.generation) this.ready = true;
    } finally {
      if (this.cancelLoad === load.cancel) this.cancelLoad = null;
    }
  }
  async start() {
    if (this.running) return true;
    if (!this.player || !this.ready)
      throw new Error("O áudio ainda está sendo preparado.");
    const generation = this.startRevision,
      player = this.player;
    const result = player.play() as unknown;
    if (result instanceof Promise) await result;
    if (generation !== this.startRevision || player !== this.player)
      return false;
    this.running = true;
    return true;
  }
  pause() {
    this.startRevision++;
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
    this.startRevision++;
    this.cancelLoad?.();
    this.cancelLoad = null;
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
  private generation = 0;
  prepare() {
    this.dispose();
    Object.entries(soundFiles).forEach(([kind, asset]) => {
      this.players.set(kind as Kind, [
        createAudioPlayer(asset),
        createAudioPlayer(asset),
      ]);
    });
  }
  async play(kind: Kind) {
    const pool = this.players.get(kind);
    if (!pool) return;
    const index = (this.index.get(kind) || 0) % pool.length;
    this.index.set(kind, index + 1);
    const player = pool[index];
    const generation = this.generation;
    try {
      await player.seekTo(0);
      if (generation === this.generation) player.play();
    } catch (error) {
      if (generation === this.generation) throw error;
    }
  }
  dispose() {
    this.generation++;
    this.players.forEach((pool) => pool.forEach((player) => player.remove()));
    this.players.clear();
  }
}
