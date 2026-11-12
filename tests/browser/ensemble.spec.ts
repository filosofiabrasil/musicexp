import { test, expect } from "@playwright/test";
import fs from "node:fs";
const open = async (page: any) => {
  await page.goto("/");
  await page.getByRole("tab", { name: "Roda e frases", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Tocar montagem", exact: true }),
  ).toBeEnabled();
};
test("cadeira toca um único buffer, termina e pode repetir; sair interrompe a roda", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const w = window as any;
    w.ensembleSources = [];
    const orig = AudioContext.prototype.createBufferSource;
    AudioContext.prototype.createBufferSource = function () {
      const s = orig.call(this);
      const entry = { s, active: false };
      w.ensembleSources.push(entry);
      const start = s.start.bind(s),
        stop = s.stop.bind(s);
      s.start = (...args: any[]) => {
        entry.active = true;
        return (start as any)(...args);
      };
      s.stop = (...args: any[]) => {
        entry.active = false;
        return (stop as any)(...args);
      };
      s.addEventListener("ended", () => {
        entry.active = false;
      });
      return s;
    };
  });
  await open(page);
  await expect(
    page.getByRole("button", { name: "Ouvir modelo de pandeiro" }),
  ).toHaveAttribute("aria-pressed", "false");
  await page
    .getByRole("button", { name: "Praticar 4 pulsos", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Tocar montagem", exact: true })
    .click();
  const state = await page.evaluate(() => {
    const list = (window as any).ensembleSources.filter((e: any) => e.active);
    return list.map((e: any) => ({
      duration: e.s.buffer.duration,
      loop: e.s.loop,
    }));
  });
  expect(state).toHaveLength(1);
  expect(state[0].duration).toBeCloseTo((8 * 60) / 84, 5);
  expect(state[0].loop).toBe(false);
  await expect(page.getByTestId("ensemble-stage")).toHaveText(
    "Montagem concluída",
    { timeout: 12000 },
  );
  await page
    .getByRole("button", { name: "Tocar montagem", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Pausar montagem", exact: true }),
  ).toBeEnabled();
  await page.getByRole("tab", { name: "Prática", exact: true }).click();
  expect(
    await page.evaluate(
      () => (window as any).ensembleSources.filter((e: any) => e.active).length,
    ),
  ).toBe(0);
});
test("dominó move peças, salva, recupera e exporta roteiro e áudio coerentes", async ({
  page,
}) => {
  await open(page);
  await page.getByRole("button", { name: "Modo Dominó de frases" }).click();
  await page
    .getByRole("button", { name: "Adicionar Virada curta H", exact: true })
    .click();
  await page.getByRole("button", { name: "Mover peça 4 para antes" }).click();
  await expect(page.getByTestId("phrase-block-2")).toContainText(
    "Virada curta H",
  );
  await page
    .getByRole("textbox", { name: "Nome da montagem" })
    .fill("Base, resposta e retorno");
  await page
    .getByRole("button", { name: "Salvar montagem", exact: true })
    .click();
  await expect(
    page.getByText("Montagem salva neste dispositivo.", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await page.getByRole("tab", { name: "Roda e frases", exact: true }).click();
  await page.getByRole("button", { name: "Abrir montagem salva" }).click();
  await expect(
    page.getByRole("textbox", { name: "Nome da montagem" }),
  ).toHaveValue("Base, resposta e retorno");
  await expect(page.getByTestId("phrase-block-2")).toContainText(
    "Virada curta H",
  );
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exportar montagem JSON" }).click();
  const json = JSON.parse(
    fs.readFileSync((await (await pending).path())!, "utf8"),
  );
  expect(json.cues.at(-1).endBeat).toBe(18);
  expect(json.scene.blocks[2].clipId).toBe("curta84");
  expect(
    json.events.some((e: any) => e.clipId === "curta84" && e.beat === 12),
  ).toBe(true);
  const wave = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exportar montagem WAV" }).click();
  const bytes = fs.readFileSync((await (await wave).path())!);
  expect(bytes.toString("ascii", 0, 4)).toBe("RIFF");
  expect(bytes.readUInt32LE(24)).toBe(44100);
  expect(bytes.readUInt32LE(40) / 2).toBe(Math.round(((22 * 60) / 84) * 44100));
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("base de 92 limpa peças incompatíveis e dados salvos ilegíveis ficam preservados", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("pandeiro.ensemble.v1", "{ilegível"),
  );
  await open(page);
  await page.getByRole("button", { name: "Abrir montagem salva" }).click();
  await expect(
    page.getByText("Montagem inválida. Os dados salvos foram preservados.", {
      exact: true,
    }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => localStorage.getItem("pandeiro.ensemble.v1")),
  ).toBe("{ilegível");
  await page.getByRole("button", { name: "Modo Dominó de frases" }).click();
  await page.getByRole("button", { name: "Base 92 BPM" }).click();
  await expect(page.getByTestId("phrase-block-0")).toContainText(
    "Levada de couro",
  );
  await expect(page.getByTestId("phrase-block-1")).toContainText(
    "Virada de couro",
  );
});
