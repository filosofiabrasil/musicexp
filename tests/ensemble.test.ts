import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  defaultEnsemble,
  defaultBlocks,
  parseEnsemble,
  phrasePlan,
  moveBlock,
  cueAt,
  ENSEMBLE_CLIPS,
  clipById,
} from "../src/music/ensemble";
import { renderEnsemble, ensemblePcm } from "../src/audio/ensemble";
import { fromBase64, wavBytes } from "../src/audio/pcm";
test("banco da roda conserva frames, origem e integridade de 14 gravações", () => {
  assert.equal(ENSEMBLE_CLIPS.length, 14);
  for (const c of ENSEMBLE_CLIPS) {
    assert.equal(
      ensemblePcm(c.id).length,
      Math.round(((c.beats * 60) / c.bpm) * 44100),
    );
    assert.equal(
      createHash("sha256").update(fromBase64(c.pcm)).digest("hex"),
      c.pcmSha256,
    );
    assert.ok(c.sourceSha256.length === 64);
  }
});
test("cadeira vazia não contém pandeiro e a referência só entra quando solicitada", () => {
  const s = defaultEnsemble();
  s.click = false;
  s.countIn = false;
  s.levels.surdo = 0;
  const empty = renderEnsemble(s);
  assert.equal(empty.events.length, 0);
  assert.ok(empty.pcm.every((v) => v === 0));
  const reference = renderEnsemble({ ...s, chairGuide: true });
  assert.ok(
    reference.events.every((e) => clipById(e.clipId).instrument === "pandeiro"),
  );
  assert.ok(reference.pcm.some((v) => v !== 0));
});
test("camadas de 92 BPM seguem frames absolutos, sem somar arredondamentos a cada volta", () => {
  const s = {
    ...defaultEnsemble(),
    bpm: 92 as const,
    blocks: defaultBlocks(92),
    cycles: 8,
  };
  const p = renderEnsemble(s);
  assert.equal(
    p.pcm.length,
    Math.round(((4 * 60) / 92) * 44100) + Math.round(((32 * 60) / 92) * 44100),
  );
  for (const e of p.events)
    assert.equal(
      e.frame,
      Math.round(((4 * 60) / 92) * 44100) +
        Math.round(((e.beat * 60) / 92) * 44100),
    );
  assert.ok(p.events.some((e) => e.clipId === "reco92" && e.beat === 30));
  assert.equal(p.pcm[p.pcm.length - 1], 0);
  assert.ok(p.pcm.every((v) => Number.isFinite(v) && Math.abs(v) <= 0.960001));
});
test("dominó posiciona todas as repetições e inclui finais de seis pulsos sem inventar pausas", () => {
  const s = {
    ...defaultEnsemble(),
    mode: "domino" as const,
    blocks: [
      { clipId: "base84", repeats: 2 },
      { clipId: "curta84", repeats: 1 },
      { clipId: "final84", repeats: 1 },
    ],
  };
  const p = phrasePlan(s);
  assert.equal(p.beats, 16);
  assert.deepEqual(
    p.cues.map((c) => [c.startBeat, c.endBeat]),
    [
      [0, 4],
      [4, 8],
      [8, 10],
      [10, 16],
    ],
  );
  assert.equal(cueAt(p.cues, -1), null);
  assert.equal(cueAt(p.cues, 8)?.clipId, "curta84");
  assert.equal(cueAt(p.cues, 16), null);
  const reordered = moveBlock(s.blocks, 2, -1);
  assert.equal(reordered[1].clipId, "final84");
  assert.equal(s.blocks[1].clipId, "curta84");
  const rendered = renderEnsemble(s);
  assert.deepEqual(
    rendered.events
      .filter((e) => clipById(e.clipId).instrument === "pandeiro")
      .map((e) => e.beat),
    [0, 4, 8, 10],
  );
});
test("montagens incompatíveis ou corrompidas não são aceitas silenciosamente", () => {
  const s = defaultEnsemble();
  assert.deepEqual(parseEnsemble(JSON.stringify(s)), s);
  for (const patch of [
    { bpm: 90 },
    { blocks: [] },
    { blocks: [{ clipId: "base92", repeats: 1 }] },
    { blocks: [{ clipId: "surdo84", repeats: 1 }] },
    { blocks: Array(12).fill({ clipId: "base84", repeats: 8 }) },
    { levels: { ...s.levels, surdo: 2 } },
    { countIn: "sim" },
  ])
    assert.throws(() => parseEnsemble(JSON.stringify({ ...s, ...patch })));
});
test("WAV exportado contém preparação e corpo completos, com taxa declarada correta", () => {
  const s = { ...defaultEnsemble(), cycles: 1 };
  const p = renderEnsemble(s),
    bytes = wavBytes(p.pcm, 44100),
    v = new DataView(bytes.buffer);
  assert.equal(v.getUint32(24, true), 44100);
  assert.equal(v.getUint32(40, true) / 2, p.pcm.length);
  assert.equal(p.introDuration, (4 * 60) / 84);
  assert.equal(p.targetDuration, (4 * 60) / 84);
  assert.equal(p.loop, false);
});
