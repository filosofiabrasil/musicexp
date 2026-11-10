import data from "../data/playback.json";
import { Kind } from "../pandeiro-ui-base/types";
import { decodePcm16 } from "./pcm";
export type SoundVariant = {
  id: string;
  file: string;
  kind: Kind;
  frames: number;
  durationMs: number;
  trimMs: number;
  sourceFrames: number;
  pcm: string;
};
export const PLAYBACK_RATE = data.rate;
export const SOUND_BANK = data.sounds as Record<Kind, SoundVariant[]>;
const decoded = new Map<string, Float32Array>();
export function soundVariant(kind: Kind, id?: string): SoundVariant {
  return SOUND_BANK[kind].find((v) => v.id === id) ?? SOUND_BANK[kind][0];
}
export function soundPcm(kind: Kind, id?: string) {
  const variant = soundVariant(kind, id);
  if (!decoded.has(variant.id))
    decoded.set(variant.id, decodePcm16(variant.pcm));
  return decoded.get(variant.id)!;
}
