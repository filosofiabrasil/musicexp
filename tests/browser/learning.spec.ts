import { test, expect, Page } from "@playwright/test";
import fs from "node:fs";
const projectsKey = "pandeiro.study.projects.v1";
const section = (page: Page, name: string) =>
  page.getByRole("tab", { name, exact: true }).click();
const start = (page: Page) =>
  page.getByRole("button", { name: "Iniciar treino", exact: true });
const total = (page: Page) =>
  page.getByText("GOLPES TOCADOS", { exact: true }).locator("..");
async function shortStudy(page: Page) {
  await page.goto("/");
  await section(page, "Estudos e escrita");
  await page
    .getByRole("textbox", { name: "Sequência de articulações" })
    .fill("PDBD");
  await page
    .getByRole("textbox", { name: "Agrupamento do estudo pessoal" })
    .fill("4");
  await page.getByRole("button", { name: "Aplicar estudo pessoal" }).click();
  await page.getByRole("textbox", { name: "BPM", exact: true }).fill("240");
  await page.getByTestId("study-heading").click();
}
test("exemplo da imagem mostra oito semicolcheias, duas semínimas e leitura 2/4 explícita", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Abrir biblioteca de ritmos" })
    .click();
  await page.getByRole("textbox", { name: "Buscar ritmo" }).fill("Samba base");
  await page
    .getByRole("button", { name: "Escolher Samba base", exact: true })
    .click();
  await page.getByRole("button", { name: "Métrica 2/4", exact: true }).click();
  const score = page.getByLabel(
    "Leitura rítmica de 8 unidades, 2 semínimas, compasso 2/4",
  );
  await expect(score).toBeVisible();
  const labels = await score.locator("text").allTextContents();
  expect(labels).toContain("C1 · 1");
  expect(labels).toContain("C1 · 2");
  const numbers = labels.filter((value) => /^\d$/.test(value));
  expect(numbers).toEqual(["1", "2", "3", "4", "1", "2", "3", "4"]);
  await expect(
    page.getByRole("button", { name: "Métrica 6/8", exact: true }),
  ).toBeDisabled();
  await expect(page.getByText("1+1/4", { exact: true })).toHaveCount(0);
  await page
    .getByRole("button", { name: "Mapa de articulações", exact: true })
    .click();
  await expect(
    page.getByLabel("Mapa das articulações de 8 unidades"),
  ).toBeVisible();
});
test("6/8 tem dois pulsos compostos e contagem de três colcheias por pulso", async ({
  page,
}) => {
  await page.goto("/");
  await section(page, "Estudos e escrita");
  await page
    .getByRole("button", { name: "Praticar 07 · Composto em 6/8", exact: true })
    .click();
  const labels = await page
    .getByLabel("Leitura rítmica de 6 unidades, 3 semínimas, compasso 6/8")
    .locator("text")
    .allTextContents();
  expect(labels.filter((value) => /^\d$/.test(value))).toEqual([
    "1",
    "2",
    "3",
    "1",
    "2",
    "3",
  ]);
  await expect(
    page.getByText(/Pulso de semínima pontuada = 66,7/),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Clique Grupos", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});
test("preparação não registra golpes e tomada finita encerra no áudio sem voltar ao início", async ({
  page,
}) => {
  await shortStudy(page);
  await page.getByRole("textbox", { name: "BPM", exact: true }).fill("120");
  await page.getByTestId("study-heading").click();
  await page
    .getByRole("button", { name: "Programa Tomada de 4 ciclos", exact: true })
    .click();
  await expect(start(page)).toBeEnabled();
  await start(page).click();
  await expect(page.getByText(/PREPARAÇÃO ·/)).toBeVisible();
  await page.keyboard.press("a");
  await expect(total(page)).toContainText("00");
  await expect(page.getByText(/^Ciclo [12] de 4$/)).toBeVisible();
  await page.keyboard.press("a");
  await expect(total(page)).toContainText("01");
  await expect(page.getByText("TOMADA CONCLUÍDA", { exact: true })).toBeVisible(
    { timeout: 5000 },
  );
  await page.keyboard.press("s");
  await expect(total(page)).toContainText("01");
  await section(page, "Caderno");
  const downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exportar tomada JSON" }).click();
  const download = await downloaded;
  const data = JSON.parse(fs.readFileSync((await download.path())!, "utf8"));
  expect(data.record.elapsed).toBeCloseTo(2, 3);
  expect(data.record.settings.program).toBe("steady");
  expect(data.hits).toHaveLength(1);
  expect(data.hits[0].t).toBeGreaterThanOrEqual(0);
});
test("memória usa um buffer sem loop com silêncio real no trecho final", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const state = window as unknown as { sources: AudioBufferSourceNode[] };
    state.sources = [];
    const create = AudioContext.prototype.createBufferSource;
    AudioContext.prototype.createBufferSource = function () {
      const source = create.call(this);
      state.sources.push(source);
      return source;
    };
  });
  await shortStudy(page);
  await page.getByRole("textbox", { name: "BPM", exact: true }).fill("60");
  await page.getByTestId("study-heading").click();
  await page
    .getByRole("button", { name: "Programa Memória de pulso", exact: true })
    .click();
  await expect(start(page)).toBeEnabled();
  await start(page).click();
  const sound = await page.evaluate(() => {
    const source = (
      window as unknown as { sources: AudioBufferSourceNode[] }
    ).sources.at(-1)!;
    return {
      duration: source.buffer!.duration,
      loop: source.loop,
      silent: source
        .buffer!.getChannelData(0)
        .slice(Math.floor(source.buffer!.sampleRate * 7.4))
        .every((value) => value === 0),
    };
  });
  expect(sound.duration).toBeCloseTo(8, 4);
  expect(sound.loop).toBe(false);
  expect(sound.silent).toBe(true);
  await expect(
    page.getByText(
      "A referência sumiu. Continue até o fim da tomada; os resultados aparecem depois.",
      { exact: true },
    ),
  ).toBeVisible({ timeout: 10000 });
  await expect(page.getByLabel(/Roda de 4 passos/)).toHaveCount(0);
  await expect(page.getByText("TOMADA CONCLUÍDA", { exact: true })).toBeVisible(
    { timeout: 5000 },
  );
});
test("escrita pessoal salva acentos e métrica, volta após recarga e permite desfazer remoção", async ({
  page,
}) => {
  await page.goto("/");
  await section(page, "Estudos e escrita");
  await page
    .getByRole("textbox", { name: "Nome do estudo pessoal" })
    .fill("Variação de acento");
  await page
    .getByRole("button", { name: "Compasso do editor 2/4", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Ferramenta acento", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Editar unidade 2", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Girar uma unidade ←", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Salvar escrita", exact: true })
    .click();
  await expect(
    page.getByText("MINHAS ESCRITAS · 1/30", { exact: true }),
  ).toBeVisible();
  let stored = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    projectsKey,
  );
  expect(stored[0].rhythm.accents).toEqual([0]);
  expect(stored[0].rhythm.meter).toBe("2/4");
  await page
    .getByRole("button", { name: "Salvar escrita", exact: true })
    .click();
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).length,
      projectsKey,
    ),
  ).toBe(1);
  await page.reload();
  await section(page, "Estudos e escrita");
  await page
    .getByRole("button", {
      name: `Praticar escrita ${stored[0].id}`,
      exact: true,
    })
    .click();
  await expect(
    page.getByText("Variação de acento", { exact: true }).first(),
  ).toBeVisible();
  await section(page, "Estudos e escrita");
  await page
    .getByRole("button", {
      name: `Remover escrita ${stored[0].id}`,
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Desfazer remoção da escrita", exact: true })
    .click();
  await expect(
    page.getByText("MINHAS ESCRITAS · 1/30", { exact: true }),
  ).toBeVisible();
});
test("biblioteca pessoal ilegível é preservada e não impede a prática", async ({
  page,
}) => {
  await page.addInitScript(
    (key) => localStorage.setItem(key, "{rascunho ilegível"),
    projectsKey,
  );
  await page.goto("/");
  await expect(start(page)).toBeEnabled();
  await section(page, "Estudos e escrita");
  await expect(page.getByRole("alert")).toContainText(
    /dados existentes foram preservados/,
  );
  await expect(
    page.getByRole("button", { name: "Salvar escrita", exact: true }),
  ).toBeDisabled();
  expect(
    await page.evaluate((key) => localStorage.getItem(key), projectsKey),
  ).toBe("{rascunho ilegível");
});
test("quota na biblioteca pessoal conserva o editor sem criar uma escrita fictícia", async ({
  page,
}) => {
  await page.addInitScript((key) => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (name, value) {
      if (name === key) throw new DOMException("cheio", "QuotaExceededError");
      return original.call(this, name, value);
    };
  }, projectsKey);
  await page.goto("/");
  await section(page, "Estudos e escrita");
  await page
    .getByRole("button", { name: "Salvar escrita", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText(
    "Nenhuma escrita foi apagada",
  );
  await expect(
    page.getByText("MINHAS ESCRITAS · 0/30", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "Sequência de articulações" }),
  ).toHaveValue("PDBDPDBD");
});
test("escuta exige ouvir antes de responder e pontua uma vez por exemplo", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Math.random = () => 0;
  });
  await page.goto("/");
  await section(page, "Articulações e sons");
  const answer = page.getByRole("button", {
    name: "Resposta auditiva P",
    exact: true,
  });
  await expect(answer).toBeDisabled();
  await page
    .getByRole("button", { name: "Ouvir exemplo oculto", exact: true })
    .click();
  await expect(answer).toBeEnabled();
  await answer.click();
  await expect(
    page.getByText(/Identificação correta\. Exemplo: P/),
  ).toBeVisible();
  await expect(answer).toBeDisabled();
  await expect(
    page.getByText("1/1 IDENTIFICAÇÕES CORRETAS NESTA RODADA", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Próximo exemplo", exact: true })
    .click();
  await expect(answer).toBeDisabled();
});
test("caderno compara duas tomadas e explicita mudança de andamento", async ({
  page,
}) => {
  await page.goto("/");
  await expect(start(page)).toBeEnabled();
  await start(page).click();
  await page.keyboard.press("a");
  await page
    .getByRole("button", { name: "Registrar tomada", exact: true })
    .click();
  await page.getByRole("button", { name: "Aumentar BPM", exact: true }).click();
  await expect(start(page)).toBeEnabled();
  await start(page).click();
  await page.keyboard.press("a");
  await page
    .getByRole("button", { name: "Registrar tomada", exact: true })
    .click();
  await section(page, "Caderno");
  const choices = page.getByRole("button", { name: /^Comparar tomada / });
  await expect(choices).toHaveCount(2);
  await choices.nth(0).click();
  await choices.nth(1).click();
  await expect(page.getByText(/Condições diferentes: andamento/)).toBeVisible();
});
