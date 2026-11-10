import { test, expect } from "@playwright/test";

test("o áudio repete três ciclos sem inserir silêncio na virada", async ({ page }) => {
  await page.addInitScript(() => {
    const capture = window as unknown as { loopSources: AudioBufferSourceNode[] };
    capture.loopSources = [];
    const original = AudioContext.prototype.createBufferSource;
    AudioContext.prototype.createBufferSource = function () {
      const source = original.call(this);
      capture.loopSources.push(source);
      return source;
    };
  });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Iniciar treino", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "Iniciar treino", exact: true }).click();
  const result = await page.evaluate(async () => {
    const source = (window as unknown as { loopSources: AudioBufferSourceNode[] }).loopSources.find(s => s.loop);
    if (!source?.buffer) throw new Error("O treino precisa usar um buffer contínuo de áudio.");
    const buffer = source.buffer;
    const offline = new OfflineAudioContext(1, buffer.length * 3, buffer.sampleRate);
    const voice = offline.createBufferSource();
    voice.buffer = buffer; voice.loop = source.loop;
    voice.loopStart = source.loopStart; voice.loopEnd = source.loopEnd;
    voice.connect(offline.destination); voice.start();
    const rendered = (await offline.startRendering()).getChannelData(0);
    const expected = buffer.getChannelData(0);
    let difference = 0;
    for (let i = 0; i < rendered.length; i++) difference = Math.max(difference, Math.abs(rendered[i] - expected[i % buffer.length]));
    return { duration: buffer.duration, difference, loopEnd: source.loopEnd };
  });
  expect(result.duration).toBeCloseTo(2.4, 5);
  expect(result.loopEnd).toBe(result.duration);
  expect(result.difference).toBeLessThan(0.00001);
});
