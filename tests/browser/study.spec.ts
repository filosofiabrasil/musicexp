import { test, expect, Page } from "@playwright/test";
import fs from "node:fs";
const journalKey = "pandeiro.study.journal.v1";
const start = (page: Page) =>
  page.getByRole("button", { name: "Iniciar treino", exact: true });

test("ciclo de sete mantém semínimas regulares no áudio e a roda continua no ciclo curto", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const state = window as unknown as { loops: AudioBufferSourceNode[] };
    state.loops = [];
    const create = AudioContext.prototype.createBufferSource;
    AudioContext.prototype.createBufferSource = function () {
      const source = create.call(this);
      state.loops.push(source);
      return source;
    };
  });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Abrir biblioteca de ritmos" })
    .click();
  await page
    .getByRole("textbox", { name: "Buscar ritmo" })
    .fill("Partido alto");
  await page
    .getByRole("button", { name: "Escolher Partido alto", exact: true })
    .click();
  await page
    .getByRole("switch", { name: "Ouvir o pandeiro", exact: true })
    .uncheck();
  await expect(start(page)).toBeEnabled();
  await start(page).click();
  const result = await page.evaluate(() => {
    const source = (
      window as unknown as { loops: AudioBufferSourceNode[] }
    ).loops.find((voice) => voice.loop)!;
    const buffer = source.buffer!,
      samples = buffer.getChannelData(0),
      positions: number[] = [];
    for (let i = 0; i < samples.length; i++)
      if (
        Math.abs(samples[i]) > 0.02 &&
        (!positions.length ||
          i - positions[positions.length - 1] > buffer.sampleRate * 0.1)
      )
        positions.push(i);
    const intervals = positions
      .slice(1)
      .map((position, i) => (position - positions[i]) / buffer.sampleRate);
    intervals.push(
      (samples.length - positions[positions.length - 1] + positions[0]) /
        buffer.sampleRate,
    );
    return { duration: buffer.duration, count: positions.length, intervals };
  });
  expect(result.duration).toBeCloseTo(4.2, 5);
  expect(result.count).toBe(7);
  for (const interval of result.intervals) expect(interval).toBeCloseTo(0.6, 4);
  await expect(page.getByText(/CICLO 2 · PASSO/)).toBeVisible({
    timeout: 3200,
  });
});

test("estudos distinguem 6/8, unidade de colcheia e grupos de três", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("tab", { name: "Estudos e escrita", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Praticar 07 · Composto em 6/8", exact: true })
    .click();
  await expect(page.getByText("COMPASSO 6/8", { exact: true })).toBeVisible();
  await expect(page.getByLabel(/Roda de 6 passos/)).toBeVisible();
  await expect(
    page.getByText(/Recorte 1–6 de 6 · Colcheias · 3 semínimas/),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Clique Grupos", exact: true })
    .click();
  await expect(page.getByText(/Inícios dos grupos 3\+3/)).toBeVisible();
});

test("editor rejeita escrita inválida e aplica articulações e agrupamento próprios", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("tab", { name: "Estudos e escrita", exact: true })
    .click();
  const sequence = page.getByRole("textbox", {
    name: "Sequência de articulações",
  });
  await sequence.fill("C#");
  await expect(
    page.getByRole("button", { name: "Aplicar estudo pessoal" }),
  ).toBeDisabled();
  await sequence.fill("PDTPDTPD");
  await page
    .getByRole("textbox", { name: "Agrupamento do estudo pessoal" })
    .fill("3+4");
  await expect(page.getByText(/A soma dos grupos deve ser 8/)).toBeVisible();
  await page
    .getByRole("textbox", { name: "Agrupamento do estudo pessoal" })
    .fill("4+4");
  await page
    .getByRole("button", { name: "Ferramenta pausa", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Editar unidade 2", exact: true })
    .click();
  await expect(sequence).toHaveValue("P.TPDTPD");
  await page
    .getByRole("textbox", { name: "Nome do estudo pessoal" })
    .fill("Estudo de leitura pessoal");
  await page.getByRole("button", { name: "Aplicar estudo pessoal" }).click();
  await expect(
    page.getByText("ESCRITA PESSOAL", { exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel(/Roda de 8 passos/)).toBeVisible();
  await page
    .getByRole("tab", { name: "Estudos e escrita", exact: true })
    .click();
  await expect(sequence).toHaveValue("P.TPDTPD");
});

test("reaplicar uma escrita com as mesmas notas inicia uma tomada independente", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("tab", { name: "Estudos e escrita", exact: true })
    .click();
  await page.getByRole("button", { name: "Aplicar estudo pessoal" }).click();
  await expect(start(page)).toBeEnabled();
  await start(page).click();
  await page.keyboard.press("a");
  const total = page.getByText("GOLPES TOCADOS", { exact: true }).locator("..");
  await expect(total).toContainText("01");
  await page
    .getByRole("tab", { name: "Estudos e escrita", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Nome do estudo pessoal" })
    .fill("Outra intenção de estudo");
  await page.getByRole("button", { name: "Aplicar estudo pessoal" }).click();
  await expect(total).toContainText("00");
  await expect(start(page)).toBeEnabled();
});

test("recorte usa posições originais e os três modos recebem a janela de cinco unidades", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /^Inspecionar unidade 3:/ }).click();
  await page
    .getByRole("button", { name: "Definir início", exact: true })
    .click();
  await page.getByRole("button", { name: /^Inspecionar unidade 7:/ }).click();
  await page.getByRole("button", { name: "Definir fim", exact: true }).click();
  await expect(page.getByText(/Recorte 3–7 de 16/)).toBeVisible();
  await expect(page.getByLabel(/Roda de 5 passos/)).toBeVisible();
  await page.getByRole("tab", { name: "Barras no tempo", exact: true }).click();
  await expect(
    page.getByLabel(
      "Barras de 5 passos. Contorno esperado, preenchimento tocado.",
    ),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Ciclo completo", exact: true })
    .click();
  await expect(
    page.getByLabel(
      "Barras de 16 passos. Contorno esperado, preenchimento tocado.",
    ),
  ).toBeVisible();
});

test("volume preserva os golpes e a redução de articulação inicia outra tomada", async ({
  page,
}) => {
  await page.goto("/");
  await expect(start(page)).toBeEnabled();
  await start(page).click();
  await page.keyboard.press("a");
  await page.keyboard.press("s");
  const total = page.getByText("GOLPES TOCADOS", { exact: true }).locator("..");
  await expect(total).toContainText("02");
  await page.getByRole("button", { name: "Volume 50%", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Pausar treino", exact: true }),
  ).toBeEnabled();
  await expect(total).toContainText("02");
  await page.getByRole("button", { name: "Isolar P", exact: true }).click();
  await expect(total).toContainText("00");
  await expect(page.getByText(/Redução ativa: Grave/)).toBeVisible();
});

test("atlas escolhe variante original e pré-escuta usa áudio em 44,1 kHz", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const state = window as unknown as { voices: AudioBufferSourceNode[] };
    state.voices = [];
    const create = AudioContext.prototype.createBufferSource;
    AudioContext.prototype.createBufferSource = function () {
      const source = create.call(this);
      state.voices.push(source);
      return source;
    };
  });
  await page.goto("/");
  await page
    .getByRole("tab", { name: "Articulações e sons", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Estudar articulação B", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Usar amostra PUNHO2", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Usar amostra PUNHO2", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .getByRole("button", { name: "Ouvir amostra PUNHO2", exact: true })
    .click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as unknown as { voices: AudioBufferSourceNode[] }).voices
            .length,
      ),
    )
    .toBeGreaterThan(0);
  const info = await page.evaluate(() => {
    const source = (
      window as unknown as { voices: AudioBufferSourceNode[] }
    ).voices.at(-1)!;
    return { rate: source.buffer!.sampleRate, loop: source.loop };
  });
  expect(info).toEqual({ rate: 44100, loop: false });
  await page.getByRole("tab", { name: "Prática", exact: true }).click();
  await expect(
    page.getByText("GOLPES TOCADOS", { exact: true }).locator(".."),
  ).toContainText("00");
});

test("alterar compensação de captura não mistura golpes com referências temporais diferentes", async ({
  page,
  context,
}) => {
  test.skip(
    !process.env.PANDEIRO_MIC_WAV,
    "Forneça PANDEIRO_MIC_WAV para exercitar a captura real.",
  );
  await context.grantPermissions(["microphone"]);
  await page.goto("/");
  await page.getByRole("button", { name: "Microfone", exact: true }).click();
  await expect(page.getByText(/Microfone ligado/)).toBeVisible();
  await expect(start(page)).toBeEnabled();
  await start(page).click();
  const total = page.getByText("GOLPES TOCADOS", { exact: true }).locator("..");
  await expect
    .poll(
      async () =>
        Number((await total.innerText()).match(/\n(\d+)\n/)?.[1] || 0),
      { timeout: 12000 },
    )
    .toBeGreaterThan(0);
  await page
    .getByRole("button", { name: "Aumentar compensação", exact: true })
    .click();
  await expect(total).toContainText("00");
  await expect(start(page)).toBeEnabled();
  await expect(page.getByText("5 ms", { exact: true })).toBeVisible();
});

test("caderno persiste uma tomada, exporta dados coerentes e não duplica ao salvar novamente", async ({
  page,
}) => {
  await page.goto("/");
  await expect(start(page)).toBeEnabled();
  await start(page).click();
  await page.keyboard.press("a");
  await page.keyboard.press("s");
  await page
    .getByRole("button", { name: "Pausar treino", exact: true })
    .click();
  await page.getByRole("tab", { name: "Caderno", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Observações da tomada" })
    .fill("Comparar ataque e ressonância.");
  await page
    .getByRole("button", { name: "Registrar tomada", exact: true })
    .click();
  await expect(
    page.getByText("1 TOMADA REGISTRADA", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Registrar tomada", exact: true })
    .click();
  await expect(
    page.getByText("1 TOMADA REGISTRADA", { exact: true }),
  ).toBeVisible();
  const jsonDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exportar tomada JSON" }).click();
  const file = await jsonDownload;
  const data = JSON.parse(fs.readFileSync((await file.path())!, "utf8"));
  expect(data.timingUnit).toBe("seconds");
  expect(data.errorUnit).toBe("milliseconds");
  expect(data.hits.length).toBe(2);
  expect(data.record.notes).toBe("Comparar ataque e ressonância.");
  expect(data.record.settings.bpm).toBe(100);
  expect(data.record.settings.range).toEqual({ start: 0, end: 16 });
  const csvDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exportar golpes CSV" }).click();
  const csv = fs.readFileSync((await (await csvDownload).path())!, "utf8");
  expect(csv).toContain(data.record.id);
  expect(csv.split("\r\n").filter(Boolean).length).toBe(3);
  await page.reload();
  await page.getByRole("tab", { name: "Caderno", exact: true }).click();
  await expect(
    page.getByText("1 TOMADA REGISTRADA", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Comparar ataque e ressonância.", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: `Remover tomada ${data.record.id}`,
      exact: true,
    })
    .click();
  await expect(
    page.getByText("0 TOMADAS REGISTRADAS", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Desfazer remoção", exact: true })
    .click();
  await expect(
    page.getByText("1 TOMADA REGISTRADA", { exact: true }),
  ).toBeVisible();
});

test("caderno corrompido preserva dados e não impede a prática", async ({
  page,
}) => {
  await page.addInitScript(
    (key) => localStorage.setItem(key, "conteúdo inválido"),
    journalKey,
  );
  await page.goto("/");
  await expect(start(page)).toBeEnabled();
  await page.getByRole("tab", { name: "Caderno", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(
    /dados existentes foram preservados/,
  );
  expect(
    await page.evaluate((key) => localStorage.getItem(key), journalKey),
  ).toBe("conteúdo inválido");
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Exportar dados preservados", exact: true })
    .click();
  expect(fs.readFileSync((await (await download).path())!, "utf8")).toBe(
    "conteúdo inválido",
  );
});

test("falha de espaço no caderno não cria registro fictício nem descarta a tomada", async ({
  page,
}) => {
  await page.addInitScript((key) => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (name, value) {
      if (name === key)
        throw new DOMException("Sem espaço", "QuotaExceededError");
      original.call(this, name, value);
    };
  }, journalKey);
  await page.goto("/");
  await expect(start(page)).toBeEnabled();
  await start(page).click();
  await page.keyboard.press("a");
  await page.getByRole("tab", { name: "Caderno", exact: true }).click();
  await page
    .getByRole("button", { name: "Registrar tomada", exact: true })
    .click();
  await expect(
    page.getByText("0 TOMADAS REGISTRADAS", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("alert").first()).toContainText(
    /Armazenamento do caderno cheio/,
  );
  expect(
    await page.evaluate((key) => localStorage.getItem(key), journalKey),
  ).toBeNull();
  await page.getByRole("tab", { name: "Prática", exact: true }).click();
  await expect(
    page.getByText("GOLPES TOCADOS", { exact: true }).locator(".."),
  ).toContainText("01");
});

test("filtros da biblioteca expõem fontes sem escolher a obra por acidente", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Abrir biblioteca de ritmos" })
    .click();
  await page.getByRole("button", { name: "Com pausas", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Buscar ritmo" })
    .fill("Marcação do surdo");
  await page
    .getByRole("button", {
      name: "Ver fontes de Marcação do surdo",
      exact: true,
    })
    .click();
  await expect(
    page.getByText(/O número de referências não equivale/),
  ).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "Buscar ritmo" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Escolher Marcação do surdo", exact: true })
    .click();
  await expect(page.getByLabel(/Roda de 8 passos/)).toBeVisible();
});

test("navegação de teclado não dispara pads fora da prática", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("tab", { name: "Prática", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("tab", { name: "Estudos e escrita", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("a");
  await page.getByRole("tab", { name: "Prática", exact: true }).click();
  await expect(
    page.getByText("GOLPES TOCADOS", { exact: true }).locator(".."),
  ).toContainText("00");
});

test("interface e estudos permanecem contidos em 320 px de largura", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/");
  for (const section of [
    "Prática",
    "Estudos e escrita",
    "Articulações e sons",
    "Caderno",
  ]) {
    await page.getByRole("tab", { name: section, exact: true }).click();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});
