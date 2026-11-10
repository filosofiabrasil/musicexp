import { expect, test } from "@playwright/test";

test("os três modos compartilham os golpes reais e o player pausa e retoma", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  const play = page.getByRole("button", {
    name: "Iniciar treino",
    exact: true,
  });
  await expect(play).toBeEnabled();
  await expect(page.getByText("Nenhum golpe registrado")).toBeVisible();
  await play.click();
  await expect(page.getByText(/CICLO 1 · PASSO/)).toBeVisible();
  await page.keyboard.press("a");
  await page.keyboard.press("s");
  await page.keyboard.press("d");
  await page.keyboard.press("f");
  const total = page.getByText("GOLPES TOCADOS", { exact: true }).locator("..");
  await expect(total).toContainText("04");
  await page.getByRole("tab", { name: "Barras no tempo" }).click();
  await expect(
    page.getByLabel(
      "Barras de 16 passos. Contorno esperado, preenchimento tocado.",
    ),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Precisão", exact: true }).click();
  await expect(
    page.getByLabel("Gráfico do erro de tempo em milissegundos"),
  ).toBeVisible();
  await expect(total).toContainText("04");
  await expect(page.getByText(/CICLO 2 · PASSO/)).toBeVisible({
    timeout: 8000,
  });
  await page
    .getByRole("button", { name: "Pausar treino", exact: true })
    .click();
  await expect(page.getByText("TREINO PAUSADO")).toBeVisible();
  await page.keyboard.press("a");
  await expect(total).toContainText("04");
  await page
    .getByRole("button", { name: "Iniciar treino", exact: true })
    .click();
  await page.keyboard.press("a");
  await expect(total).toContainText("05");
  expect(errors).toEqual([]);
});

test("a biblioteca filtra PADBT e os ciclos de 7, 24 e 32 passos cabem nos modos", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Abrir biblioteca de ritmos" })
    .click();
  await page.getByRole("button", { name: "PADBT · 75" }).click();
  await expect(page.getByText(/75 RESULTADOS/)).toBeVisible();
  await page
    .getByRole("textbox", { name: "Buscar ritmo" })
    .fill("Partido alto");
  await page
    .getByRole("button", { name: "Escolher Partido alto", exact: true })
    .click();
  await expect(page.getByLabel(/Roda de 7 passos/)).toBeVisible();
  await page.getByRole("tab", { name: "Barras no tempo" }).click();
  await expect(
    page.getByLabel(
      "Barras de 7 passos. Contorno esperado, preenchimento tocado.",
    ),
  ).toBeVisible();
  for (const [name, steps] of [
    ["Funk em sextinas 1", 24],
    ["Forró em fusas", 32],
  ] as const) {
    await page
      .getByRole("button", { name: "Abrir biblioteca de ritmos" })
      .click();
    await page.getByRole("button", { name: "Completa · 148" }).click();
    await page.getByRole("textbox", { name: "Buscar ritmo" }).fill(name);
    await page
      .getByRole("button", { name: `Escolher ${name}`, exact: true })
      .click();
    await expect(
      page.getByLabel(
        `Barras de ${steps} passos. Contorno esperado, preenchimento tocado.`,
      ),
    ).toBeVisible();
  }
});

test("BPM reinicia a sessão e o layout funciona na largura de um celular", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Iniciar treino", exact: true }),
  ).toBeEnabled();
  await page
    .getByRole("button", { name: "Iniciar treino", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Tocar Grave · polegar", exact: true })
    .click();
  await expect(
    page.getByText("GOLPES TOCADOS", { exact: true }).locator(".."),
  ).toContainText("01");
  await page.getByRole("button", { name: "Aumentar BPM" }).click();
  await expect(
    page.getByRole("textbox", { name: "BPM", exact: true }),
  ).toHaveValue("105");
  await expect(
    page.getByText("GOLPES TOCADOS", { exact: true }).locator(".."),
  ).toContainText("00");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("permissão negada mostra erro e mantém a entrada por toque", async ({
  page,
  context,
}) => {
  await context.grantPermissions([], { origin: "http://127.0.0.1:8081" });
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = async () => {
      throw new DOMException("Permissão negada", "NotAllowedError");
    };
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Microfone", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(/Permissão negada/);
  await expect(
    page.getByRole("button", { name: "Tocar Grave · polegar", exact: true }),
  ).toBeEnabled();
});

test("microfone processa PCM de verdade e encerra a captura ao mudar para toque", async ({
  page,
  context,
}) => {
  test.skip(
    !process.env.PANDEIRO_MIC_WAV,
    "Forneça PANDEIRO_MIC_WAV para validar captura com um WAV conhecido.",
  );
  await context.grantPermissions(["microphone"]);
  await page.goto("/");
  await page.getByRole("button", { name: "Microfone", exact: true }).click();
  await expect(page.getByText(/Microfone ligado/)).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Iniciar treino", exact: true }),
  ).toBeEnabled();
  await page
    .getByRole("button", { name: "Iniciar treino", exact: true })
    .click();
  await expect
    .poll(
      async () => {
        const text = await page
          .getByText("GOLPES TOCADOS", { exact: true })
          .locator("..")
          .innerText();
        return Number(text.match(/\n(\d+)\n/)?.[1] || 0);
      },
      { timeout: 12000 },
    )
    .toBeGreaterThan(0);
  await page.getByRole("button", { name: "Toque", exact: true }).click();
  await expect(page.getByText(/Microfone ligado/)).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Tocar Grave · polegar", exact: true }),
  ).toBeEnabled();
});
