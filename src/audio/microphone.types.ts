export type PcmCallback = (
  samples: Float32Array,
  sampleRate: number,
  monotonicStart: number,
) => void;
export type Microphone = { stop: () => Promise<void> };
