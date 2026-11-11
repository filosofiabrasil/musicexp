import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from "expo-audio";
import { Kind, CODES, STROKES } from "../pandeiro-ui-base/types";
import { wavBytes } from "./pcm";
import { wavSource } from "./wavSource";
import { mixPlayback, PlaybackConfig } from "./mixCycle";
import { waitForAudioLoad } from "./waitForAudioLoad";
export { mixCycle, PlaybackConfig } from "./mixCycle";
import { PLAYBACK_RATE, soundVariant } from "./sampleLibrary";
import { SAMPLE_ASSETS } from "../data/sampleAssets";
import { SampleChoices } from "../music/score";

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
  private volume = 1;
  private intro = 0;
  private looping = true;
  private target: number | null = null;
  private endListener: { remove: () => void } | null = null;
  finished = false;
  onFinish?: () => void;
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
    const playback = mixPlayback(config);
    const pcm = playback.pcm;
    const source = await wavSource(wavBytes(pcm, PLAYBACK_RATE));
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
    this.duration = playback.logicalDuration;
    this.actualDuration = pcm.length / PLAYBACK_RATE;
    this.intro = playback.introDuration;
    this.looping = playback.loop;
    this.target = playback.targetDuration;
    this.finished = false;
    player.volume = this.volume;
    player.loop = playback.loop;
    this.endListener = player.addListener("playbackStatusUpdate", (status) => {
      if (!this.looping && player === this.player && status.didJustFinish) {
        this.finished = true;
        this.running = false;
        this.onFinish?.();
      }
    });
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
    if (this.finished) return false;
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
  setVolume(value: number) {
    this.volume = Math.max(0, Math.min(1, value));
    if (this.player) this.player.volume = this.volume;
  }
  getTime = () => {
    if (!this.player) return 0;
    if (this.finished) return this.target ?? 0;
    const position = this.player.currentTime;
    if (this.looping && position < this.previous - this.actualDuration * 0.5)
      this.cycles++;
    this.previous = position;
    return (
      (this.cycles + position / this.actualDuration) * this.duration -
      this.intro
    );
  };
  private releasePlayer() {
    this.startRevision++;
    this.cancelLoad?.();
    this.cancelLoad = null;
    this.endListener?.remove();
    this.endListener = null;
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
    this.finished = false;
  }
}

export class PadSounds {
  private players = new Map<string, AudioPlayer[]>();
  private index = new Map<string, number>();
  private generation = 0;
  private volume = 1;
  private pool(kind: Kind, variantId?: string) {
    const variant = soundVariant(kind, variantId);
    if (!this.players.has(variant.id)) {
      const asset = SAMPLE_ASSETS[variant.id];
      const players = [createAudioPlayer(asset), createAudioPlayer(asset)];
      players.forEach((player) => {
        player.volume = this.volume;
      });
      this.players.set(variant.id, players);
    }
    return { id: variant.id, players: this.players.get(variant.id)! };
  }
  prepare(choices: SampleChoices = {}) {
    this.dispose();
    for (const code of CODES) {
      const kind = STROKES[code].kind;
      this.pool(kind, choices[kind]);
    }
  }
  setVolume(value: number) {
    this.volume = Math.max(0, Math.min(1, value));
    this.players.forEach((pool) =>
      pool.forEach((player) => {
        player.volume = this.volume;
      }),
    );
  }
  async play(kind: Kind, variantId?: string) {
    const { id, players } = this.pool(kind, variantId);
    const index = (this.index.get(id) || 0) % players.length;
    this.index.set(id, index + 1);
    const player = players[index],
      generation = this.generation;
    try {
      await player.seekTo(0);
      if (generation !== this.generation) return false;
      player.play();
      return true;
    } catch (error) {
      if (generation === this.generation) throw error;
      return false;
    }
  }
  silence() {
    this.generation++;
    this.players.forEach((pool) => pool.forEach((player) => player.pause()));
  }
  dispose() {
    this.silence();
    this.players.forEach((pool) => pool.forEach((player) => player.remove()));
    this.players.clear();
    this.index.clear();
  }
}
