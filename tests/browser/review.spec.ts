import { expect, test, Page } from "@playwright/test";

async function holdAudioResume(page: Page) {
  await page.addInitScript(() => {
    const state = window as unknown as {
      testAudio: AudioContext;
      releaseAudio: () => void;
      loopSources: AudioBufferSourceNode[];
    };
    state.loopSources = [];
    const originalBuffer = AudioContext.prototype.createBuffer;
    AudioContext.prototype.createBuffer = function (...args) {
      state.testAudio = this;
      return originalBuffer.apply(this, args);
    };
    const originalSource = AudioContext.prototype.createBufferSource;
    AudioContext.prototype.createBufferSource = function () {
      const source = originalSource.call(this);
      state.loopSources.push(source);
      return source;
    };
  });
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Iniciar treino", exact: true }),
  ).toBeEnabled();
  await page.evaluate(async () => {
    const state = window as unknown as {
      testAudio: AudioContext;
      releaseAudio: () => void;
    };
    const ctx = state.testAudio;
    await ctx.suspend();
    const resume = ctx.resume.bind(ctx);
    const pending: (() => void)[] = [];
    ctx.resume = () =>
      new Promise<void>((resolve, reject) => {
        pending.push(() => {
          void resume().then(resolve, reject);
        });
      });
    state.releaseAudio = () =>
      pending.splice(0).forEach((release) => release());
  });
}

test("trocar BPM cancela um início pendente de áudio", async ({ page }) => {
  await holdAudioResume(page);
  await page
    .getByRole("button", { name: "Iniciar treino", exact: true })
    .click();
  await page.getByRole("button", { name: "Aumentar BPM" }).click();
  await page.evaluate(() =>
    (window as unknown as { releaseAudio: () => void }).releaseAudio(),
  );
  await expect(
    page.getByRole("button", { name: "Iniciar treino", exact: true }),
  ).toBeEnabled();
  expect(
    await page.evaluate(
      () =>
        (
          window as unknown as { loopSources: AudioBufferSourceNode[] }
        ).loopSources.filter((s) => s.loop).length,
    ),
  ).toBe(0);
});

test("atalhos rápidos não criam duas fontes de áudio ao iniciar", async ({
  page,
}) => {
  await holdAudioResume(page);
  await page.getByTestId("study-heading").click();
  await page.keyboard.press("Space");
  await page.keyboard.press("Space");
  await page.evaluate(() =>
    (window as unknown as { releaseAudio: () => void }).releaseAudio(),
  );
  await expect(
    page.getByRole("button", { name: "Pausar treino", exact: true }),
  ).toBeEnabled();
  expect(
    await page.evaluate(
      () =>
        (
          window as unknown as { loopSources: AudioBufferSourceNode[] }
        ).loopSources.filter((s) => s.loop).length,
    ),
  ).toBe(1);
});

test("permissão cancelada não exibe erro tardio ao voltar para Toque", async ({
  page,
}) => {
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = () =>
      new Promise((_resolve, reject) => {
        (window as unknown as { rejectMic: () => void }).rejectMic = () =>
          reject(new DOMException("Cancelada", "NotAllowedError"));
      });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Microfone", exact: true }).click();
  await page.getByRole("button", { name: "Toque", exact: true }).click();
  await page.evaluate(async () => {
    (window as unknown as { rejectMic: () => void }).rejectMic();
    await new Promise((resolve) => setTimeout(resolve, 50));
  });
  await expect(page.getByRole("alert")).toHaveCount(0);
});

test("o atalho Espaço respeita o bloqueio durante a calibração", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["microphone"]);
  await page.goto("/");
  await page.getByRole("switch", { name: "Metrônomo" }).uncheck();
  await page.getByRole("button", { name: "Microfone", exact: true }).click();
  await expect(page.getByText(/Microfone ligado/)).toBeVisible();
  await expect(page.getByRole("switch", { name: "Metrônomo" })).toBeChecked();
  await page
    .getByRole("button", { name: "Calibrar Grave · polegar", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Iniciar treino", exact: true }),
  ).toBeDisabled();
  await page.getByTestId("study-heading").click();
  await page.keyboard.press("Space");
  await expect(
    page.getByRole("button", { name: "Iniciar treino", exact: true }),
  ).toBeDisabled();
  await expect(page.getByText("○ EM PAUSA", { exact: true })).toBeVisible();
});

test("Espaço em uma aba não inicia o áudio como efeito colateral", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Iniciar treino", exact: true }),
  ).toBeEnabled();
  await page.getByRole("tab", { name: "Barras no tempo", exact: true }).focus();
  await page.keyboard.press("Space");
  await expect(
    page.getByRole("button", { name: "Iniciar treino", exact: true }),
  ).toBeEnabled();
  await expect(page.getByText("○ EM PAUSA", { exact: true })).toBeVisible();
});

test("pedidos de microfone aguardam o encerramento da tentativa cancelada", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const state = window as unknown as {
      micRequests: number;
      rejectMics: (() => void)[];
    };
    state.micRequests = 0;
    state.rejectMics = [];
    navigator.mediaDevices.getUserMedia = () => {
      state.micRequests++;
      return new Promise((_resolve, reject) => {
        state.rejectMics.push(() =>
          reject(new DOMException("Cancelada", "NotAllowedError")),
        );
      });
    };
  });
  await page.goto("/");
  const touch = page.getByRole("button", { name: "Toque", exact: true });
  await page.getByRole("button", { name: "Microfone", exact: true }).click();
  await touch.click();
  await page.getByRole("button", { name: "Microfone", exact: true }).click();
  expect(
    await page.evaluate(
      () => (window as unknown as { micRequests: number }).micRequests,
    ),
  ).toBe(1);
  await page.evaluate(() =>
    (window as unknown as { rejectMics: (() => void)[] }).rejectMics.shift()!(),
  );
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as unknown as { micRequests: number }).micRequests,
      ),
    )
    .toBe(2);
  await touch.click();
  await page.evaluate(async () => {
    (window as unknown as { rejectMics: (() => void)[] }).rejectMics.shift()!();
    await new Promise((resolve) => setTimeout(resolve, 50));
  });
  await expect(page.getByRole("alert")).toHaveCount(0);
});
