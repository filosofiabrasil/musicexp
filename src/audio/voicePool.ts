export const MAX_SAMPLE_VOICES = 8;

export type VoiceState = { playing: boolean };

/** Reusa primeiro uma voz livre; cresce o pool antes de interromper caudas. */
export function acquireVoice(
  voices: readonly VoiceState[],
  cursor: number,
  limit = MAX_SAMPLE_VOICES,
) {
  const free = voices.findIndex((voice) => !voice.playing);
  if (free >= 0) return { index: free, grow: false };
  if (voices.length < limit) return { index: voices.length, grow: true };
  const fallback = Math.trunc(cursor);
  return {
    index: ((fallback % voices.length) + voices.length) % voices.length,
    grow: false,
  };
}
