import assert from "node:assert/strict";
import test from "node:test";
import {
  OnsetDetector,
  classify,
  extractFeatures,
  type Onset,
  type TemplateBank,
} from "../src/audio/dsp";
import { decodePcm16, fromBase64, toBase64, wavBytes } from "../src/audio/pcm";
import { CODES, STROKES } from "../src/pandeiro-ui-base/types";
import bank from "../src/data/templates.json";
import kit from "../src/data/kit.json";
import { mixCycle } from "../src/audio/mixCycle";
import { toPattern, barDuration } from "../src/pandeiro-ui-base/types";
import rhythms from "../src/data/rhythms.json";
import { PLAYBACK_RATE } from "../src/audio/sampleLibrary";
import { waitForAudioLoad } from "../src/audio/waitForAudioLoad";

test("o timbre normaliza cruzamentos de zero entre 16, 44,1 e 48 kHz", () => {
  const features = [16000, 44100, 48000].map((rate) =>
    extractFeatures(
      Float32Array.from({ length: Math.round(rate * 0.04) }, (_, i) =>
        Math.sin((2 * Math.PI * 1000 * i) / rate),
      ),
      rate,
    ),
  );
  for (const feature of features)
    assert.ok(Math.abs(feature[11] - features[0][11]) < 0.004);
});

test("cancelar o carregamento libera o listener e ignora eventos tardios", async () => {
  let callback: ((status: { isLoaded: boolean }) => void) | undefined,
    removed = 0;
  const load = waitForAudioLoad({
    isLoaded: false,
    addListener: (_event, handler) => {
      callback = handler;
      return {
        remove: () => {
          removed++;
        },
      };
    },
  });
  load.cancel();
  assert.equal(await load.promise, false);
  callback?.({ isLoaded: true });
  load.cancel();
  assert.equal(removed, 1);
});

test("carregamento concluído e timeout também removem o listener", async () => {
  let callback: ((status: { isLoaded: boolean }) => void) | undefined,
    removed = 0;
  const player = {
    isLoaded: false,
    addListener: (
      _event: "playbackStatusUpdate",
      handler: (status: { isLoaded: boolean }) => void,
    ) => {
      callback = handler;
      return {
        remove: () => {
          removed++;
        },
      };
    },
  };
  const loaded = waitForAudioLoad(player);
  callback?.({ isLoaded: true });
  assert.equal(await loaded.promise, true);
  const timeout = waitForAudioLoad(player, 1);
  await assert.rejects(timeout.promise, /carregar o áudio/);
  assert.equal(removed, 2);
});

test("os 148 ritmos têm exatamente os frames da grade, sem tempo adicional", () => {
  for (const rhythm of rhythms) {
    const config = {
      pattern: toPattern(rhythm.sequence),
      steps: rhythm.sequence.length,
      bpm: 100,
      subdivision: rhythm.subdivision,
      guide: true,
      click: false,
    };
    const pcm = mixCycle(config);
    assert.equal(
      pcm.length,
      Math.round(
        barDuration(100, config.steps, config.subdivision) * PLAYBACK_RATE,
      ),
      rhythm.name,
    );
    assert.ok(
      pcm.some((v) => Math.abs(v) > 0.001),
      rhythm.name,
    );
  }
});

test("PCM/base64 e WAV preservam formato, sinal e duração", () => {
  const input = new Uint8Array([0, 1, 2, 253, 254, 255, 17]);
  assert.deepEqual(fromBase64(toBase64(input)), input);
  assert.equal(decodePcm16("AIAAAP9/")[0], -1);
  const wav = wavBytes(new Float32Array([-1, 0, 1]), 16000),
    view = new DataView(wav.buffer);
  assert.equal(new TextDecoder().decode(wav.slice(0, 4)), "RIFF");
  assert.equal(view.getUint32(24, true), 16000);
  assert.equal(view.getUint32(40, true), 6);
  assert.equal(view.getInt16(44, true), -32767);
  assert.equal(view.getInt16(48, true), 32767);
});
test("detector atravessa fronteiras de buffers e marca o instante do ataque no PCM", () => {
  const rate = 16000,
    pcm = new Float32Array(rate / 2),
    onsets: Onset[] = [];
  for (let i = 1600; i < 2600; i++)
    pcm[i] = 0.5 * Math.sin((2 * Math.PI * 200 * (i - 1600)) / rate);
  const detector = new OnsetDetector((onset) => onsets.push(onset));
  for (let i = 0; i < pcm.length; i += 117)
    detector.process(pcm.slice(i, i + 117), rate, 10 + i / rate);
  assert.equal(onsets.length, 1);
  assert.ok(Math.abs(onsets[0].time - 10.1) <= 0.002);
});
test("silêncio e ruído baixo não geram golpes", () => {
  const onsets: Onset[] = [],
    detector = new OnsetDetector((o) => onsets.push(o));
  detector.process(
    Float32Array.from({ length: 32000 }, (_, i) => 0.0005 * Math.sin(i)),
    16000,
    0,
  );
  assert.equal(onsets.length, 0);
});
test("os nove samples usados no player têm referências com o mesmo contrato de características", () => {
  for (const code of CODES) {
    const kind = STROKES[code].kind,
      features = extractFeatures(decodePcm16(kit.samples[kind]), kit.rate);
    const result = classify(features, bank as TemplateBank)!;
    assert.equal(result.kind, kind, kind);
    assert.ok(result.accepted, kind);
  }
});
test("classificador rejeita empates de timbre em vez de inventar um vencedor", () => {
  const feature = new Array(12).fill(0.2);
  assert.equal(
    classify(feature, { grave: [feature], tapa: [feature] })?.accepted,
    false,
  );
  assert.equal(classify(feature, {}), null);
});
