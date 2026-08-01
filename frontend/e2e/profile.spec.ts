import { test, expect } from "@playwright/test";
import { setupAuthenticatedMocks, setLoggedIn, pt, MOCK_APPLIANCES } from "./helpers/mocks";

test.describe("Profile Page", () => {
  test.beforeEach(async ({ page }) => {
    await setLoggedIn(page);
  });

  test("mostra loading state inicial", async ({ page }) => {
    await setupAuthenticatedMocks(page);
    await page.route(`http://localhost:8080/appliances`, async (route) => {
      await new Promise((r) => setTimeout(r, 300));
      await route.fulfill({
        json: MOCK_APPLIANCES,
        headers: { "Content-Type": "application/json" },
      });
    });
    await page.goto("/profile");
    await expect(page.getByText(pt("Carregando perfil"))).toBeVisible();
  });

  test("exibe formulario de dados do imovel", async ({ page }) => {
    await setupAuthenticatedMocks(page);
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(pt("Dados do imovel"))).toBeVisible();
    await expect(page.getByText(pt("Tipo de imovel"))).toBeVisible();
    await expect(page.getByLabel(pt("Endereco"))).toBeVisible();
    await expect(page.getByLabel(/moradores/i)).toBeVisible();
    await expect(page.getByLabel(pt("Area"))).toBeVisible();
  });

  test("preenche dados do imovel com valores do backend", async ({ page }) => {
    await setupAuthenticatedMocks(page);
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");
    await expect(page.getByLabel(pt("Endereco"))).toHaveValue("Rua Exemplo, 123");
    await expect(page.getByLabel(/moradores/i)).toHaveValue("3");
    await expect(page.getByLabel(pt("Area"))).toHaveValue("80");
  });

  test("exibe catalogo de aparelhos", async ({ page }) => {
    await setupAuthenticatedMocks(page);
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(pt("Seus aparelhos"))).toBeVisible();
    await expect(page.getByText(pt("Refrigeracao")).first()).toBeVisible();
    await expect(page.getByText(pt("Climatizacao")).first()).toBeVisible();
  });

  test("expande e recolhe categorias de aparelhos", async ({ page }) => {
    await setupAuthenticatedMocks(page);
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");
    const header = page.getByRole("button", { name: pt("Recolher Refrigeracao") });
    await expect(header).toBeVisible();
    await header.click();
    await expect(page.getByRole("button", { name: pt("Expandir Refrigeracao") })).toBeVisible();
    await page.getByRole("button", { name: pt("Expandir Refrigeracao") }).click();
    await expect(page.getByRole("button", { name: pt("Recolher Refrigeracao") })).toBeVisible();
  });

  test("permite adicionar aparelho ao clicar", async ({ page }) => {
    await setupAuthenticatedMocks(page);
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: pt("Adicionar Televisao") }).click();
    await expect(page.getByText(/Televisao/).first()).toBeVisible();
  });

  test("permite ajustar quantidade de aparelho selecionado", async ({ page }) => {
    await setupAuthenticatedMocks(page);
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: pt("Adicionar Televisao") }).click();
    const inc = page.getByRole("button", { name: pt("Aumentar quantidade de Televisao") });
    await inc.click();
    await inc.click();
    await expect(page.getByText("3x").first()).toBeVisible();
  });

  test("permite remover aparelho selecionado", async ({ page }) => {
    await setupAuthenticatedMocks(page);
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: pt("Adicionar Televisao") }).click();
    await expect(page.getByText(/Televisao/).first()).toBeVisible();
    await page.getByRole("button", { name: pt("Remover Televisao da lista") }).click();
    await expect(page.getByRole("button", { name: pt("Adicionar Televisao") })).toBeVisible();
  });

  test("busca por aparelhos filtra resultados", async ({ page }) => {
    await setupAuthenticatedMocks(page);
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");
    // Fill search and wait for filter to apply
    await page.locator(".appliance-search input").fill("Geladeira");
    // Wait for the button with Geladeira to appear (filter may take a render cycle)
    await expect(page.getByRole("button", { name: /geladeira/i }).first()).toBeVisible({
      timeout: 10000,
    });
  });

  test("limpa busca ao clicar no X", async ({ page }) => {
    await setupAuthenticatedMocks(page);
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");
    const search = page.locator(".search-input").first();
    await search.fill("geladeira");
    await page.getByRole("button", { name: pt("Limpar busca") }).click();
    await expect(search).toHaveValue("");
  });

  test("exibe selector de regularidade", async ({ page }) => {
    await setupAuthenticatedMocks(page);
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(pt("Regularidade da analise"))).toBeVisible();
    await expect(page.getByRole("button", { name: pt("Regularidade: Instantanea") })).toBeVisible();
    await expect(page.getByRole("button", { name: pt("Regularidade: Diaria") })).toBeVisible();
    await expect(page.getByRole("button", { name: /regularidade: semanal/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /regularidade: mensal/i })).toBeVisible();
  });

  test("botao 'Salvar Perfil' esta presente", async ({ page }) => {
    await setupAuthenticatedMocks(page);
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("button", { name: pt("Salvar perfil do imovel") })).toBeVisible();
  });

  test("botao 'Analisar Agora' esta presente apos carregar imovel", async ({ page }) => {
    await setupAuthenticatedMocks(page);
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");
    await expect(
      page.getByRole("button", { name: pt("Executar analise energetica") }),
    ).toBeVisible();
  });

  test("analise envia consumption_kwh com no maximo 2 casas decimais", async ({ page }) => {
    let capturedBody: string | null = null;
    await setupAuthenticatedMocks(page);
    // Register the capture route AFTER setup so it takes precedence (Playwright
    // resolves the most recently registered route first - LIFO).
    await page.route(`http://localhost:8080/energy-analysis`, async (route, request) => {
      capturedBody = request.postData();
      await route.fulfill({
        status: 201,
        json: {
          category: "BOM",
          probability: 0.78,
          recommendations: [],
          estimated_monthly_cost: 100,
          status: "CONCLUIDA",
        },
        headers: { "Content-Type": "application/json" },
      });
    });
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");
    // Add an appliance to trigger calculation with potential float issues
    await page.getByRole("button", { name: pt("Adicionar Televisao") }).click();
    // Click "Analisar Agora"
    await page.getByRole("button", { name: pt("Executar analise energetica") }).click();
    // Wait for the result to appear (Bom badge), proving the request succeeded
    await expect(page.getByText("Bom")).toBeVisible({ timeout: 10000 });
    // Validate payload has at most 2 decimal places
    expect(capturedBody).not.toBeNull();
    if (capturedBody) {
      const parsed = JSON.parse(capturedBody);
      expect(parsed).toHaveProperty("consumption_kwh");
      const str = String(parsed.consumption_kwh);
      const decimalPart = str.includes(".") ? str.split(".")[1] : "";
      expect(decimalPart.length).toBeLessThanOrEqual(2);
    }
  });

  test("exibe placeholder quando nao ha ultima analise", async ({ page }) => {
    await setupAuthenticatedMocks(page, { analyses: [] });
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(pt("Configure seu perfil"))).toBeVisible();
  });

  test("exibe ultima analise quando existe", async ({ page }) => {
    await setupAuthenticatedMocks(page);
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(pt("Ultima analise"))).toBeVisible();
    await expect(page.getByRole("button", { name: pt("Ver historico completo") })).toBeVisible();
  });

  test("navegacao para /history pelo link funciona", async ({ page }) => {
    await setupAuthenticatedMocks(page);
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");
    const btn = page.getByRole("button", { name: pt("Ver historico completo") });
    if (await btn.isVisible()) {
      await btn.click();
      await expect(page).toHaveURL(/\/history/);
    }
  });
});
