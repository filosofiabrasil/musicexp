import data from "../data/ensemble.json";
export type EnsembleTempo = 84 | 92;
export type EnsembleClip = (typeof data.clips)[number];
export const ENSEMBLE_CLIPS = data.clips;
export const ENSEMBLE_RATE = data.rate;
export type PhraseBlock = { clipId: string; repeats: number };
export type EnsembleScene = {
  version: 1;
  mode: "chair" | "domino";
  bpm: EnsembleTempo;
  title: string;
  cycles: number;
  blocks: PhraseBlock[];
  chairGuide: boolean;
  dominoGuide: boolean;
  click: boolean;
  countIn: boolean;
  levels: { surdo: number; agogo: number; reco: number; pandeiro: number };
};
export function clipById(id: string) {
  const clip = ENSEMBLE_CLIPS.find((c) => c.id === id);
  if (!clip) throw new Error("Trecho desconhecido.");
  return clip;
}
export function defaultBlocks(bpm: EnsembleTempo): PhraseBlock[] {
  return [
    { clipId: `base${bpm}`, repeats: bpm === 84 ? 2 : 4 },
    { clipId: `virada${bpm}`, repeats: 1 },
    { clipId: `base${bpm}`, repeats: bpm === 84 ? 1 : 2 },
  ];
}
export function defaultEnsemble(): EnsembleScene {
  return {
    version: 1,
    mode: "chair",
    bpm: 84,
    title: "Minha roda",
    cycles: 4,
    blocks: defaultBlocks(84),
    chairGuide: false,
    dominoGuide: true,
    click: true,
    countIn: true,
    levels: { surdo: 0.75, agogo: 0.25, reco: 0.25, pandeiro: 0.5 },
  };
}
export function parseEnsemble(raw: string): EnsembleScene {
  let s;
  try {
    s = JSON.parse(raw);
  } catch {
    throw new Error("Montagem inválida. Os dados salvos foram preservados.");
  }
  if (
    !s ||
    s.version !== 1 ||
    !["chair", "domino"].includes(s.mode) ||
    ![84, 92].includes(s.bpm) ||
    typeof s.title !== "string" ||
    s.title.length > 80 ||
    ![1, 2, 4, 8].includes(s.cycles) ||
    !s.levels ||
    !["surdo", "agogo", "reco", "pandeiro"].every(
      (k) =>
        typeof s.levels[k] === "number" &&
        Number.isFinite(s.levels[k]) &&
        s.levels[k] >= 0 &&
        s.levels[k] <= 1,
    ) ||
    !["chairGuide", "dominoGuide", "click", "countIn"].every(
      (k) => typeof s[k] === "boolean",
    ) ||
    !Array.isArray(s.blocks) ||
    s.blocks.length < 1 ||
    s.blocks.length > 12
  )
    throw new Error("Montagem inválida.");
  let beats = 0;
  for (const b of s.blocks) {
    if (
      !b ||
      typeof b.clipId !== "string" ||
      !Number.isInteger(b.repeats) ||
      b.repeats < 1 ||
      b.repeats > 8
    )
      throw new Error("Peça inválida.");
    const clip = clipById(b.clipId);
    if (clip.bpm !== s.bpm || clip.instrument !== "pandeiro")
      throw new Error("As peças precisam usar o mesmo andamento.");
    beats += clip.beats * b.repeats;
  }
  if (beats > 64) throw new Error("A montagem pode ter até 64 pulsos.");
  return s as EnsembleScene;
}
export type PhraseCue = {
  index: number;
  clipId: string;
  title: string;
  startBeat: number;
  endBeat: number;
  repeat: number;
};
export function phrasePlan(scene: EnsembleScene) {
  parseEnsemble(JSON.stringify(scene));
  let beat = 0;
  const cues: PhraseCue[] = [];
  const blocks =
    scene.mode === "chair"
      ? [
          {
            clipId: `base${scene.bpm}`,
            repeats: scene.cycles * (scene.bpm === 92 ? 2 : 1),
          },
        ]
      : scene.blocks;
  blocks.forEach((block, index) => {
    const clip = clipById(block.clipId);
    for (let r = 0; r < block.repeats; r++) {
      cues.push({
        index,
        clipId: clip.id,
        title: clip.title,
        startBeat: beat,
        endBeat: beat + clip.beats,
        repeat: r + 1,
      });
      beat += clip.beats;
    }
  });
  return { cues, beats: beat };
}
export function cueAt(cues: PhraseCue[], beat: number) {
  return cues.find((c) => beat >= c.startBeat && beat < c.endBeat) ?? null;
}
export function moveBlock(
  blocks: PhraseBlock[],
  index: number,
  direction: -1 | 1,
) {
  const destination = index + direction;
  if (
    index < 0 ||
    index >= blocks.length ||
    destination < 0 ||
    destination >= blocks.length
  )
    return blocks;
  const next = blocks.map((b) => ({ ...b }));
  [next[index], next[destination]] = [next[destination], next[index]];
  return next;
}
