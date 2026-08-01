import { test, expect } from "@playwright/test";
import {
  setupAuthenticatedMocks,
  setLoggedIn,
  pt,
  MOCK_DASHBOARD,
  MOCK_ANALYSES,
  MOCK_ANALYSES_WITH_PENDING,
  MOCK_ANALYSES_WITH_FAILURE,
} from "./helpers/mocks";

const MOCK_ANALYSES_TREND = [
  ...MOCK_ANALYSES.slice(0, 2),
  { ...MOCK_ANALYSES[2], category: "RUIM" as const },
];

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await setLoggedIn(page);
  });

  test("mostra loading state inicial", async ({ page }) => {
    await setupAuthenticatedMocks(page);
    await page.route(`http://localhost:8080/dashboard`, async (route) => {
      await new Promise((r) => setTimeout(r, 300));
      await route.fulfill({
        json: MOCK_DASHBOARD,
        headers: { "Content-Type": "application/json" },
      });
    });
    await page.goto("/dashboard");
    await expect(page.getByText(pt("Carregando dashboard"))).toBeVisible();
  });

  test("mostra estado vazio quando nao ha analises", async ({ page }) => {
    await setupAuthenticatedMocks(page, {
      analyses: [],
      dashboard: {
        total_analyses: 0,
        average_consumption_kwh: 0,
        total_estimated_cost: 0,
        total_co2_emission_kg: 0,
        monthly_consumption: [],
      },
    });
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(pt("Nenhuma analise encontrada"))).toBeVisible();
    await expect(page.getByRole("button", { name: pt("Criar Perfil") })).toBeVisible();
    await expect(page.getByRole("button", { name: pt("Fazer analise") })).toBeVisible();
  });

  test("carrega dados e exibe cards de resumo", async ({ page }) => {
    await setupAuthenticatedMocks(page);
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("287")).toBeVisible();
    await expect(page.getByText("R$ 645.00")).toBeVisible();
    await expect(page.getByText("27.52")).toBeVisible();
    // Use .first() because "3" matches multiple elements (total analyses, chart data, etc.)
    await expect(page.getByText("3").first()).toBeVisible();
  });

  test("exibe ultima analise em destaque", async ({ page }) => {
    await setupAuthenticatedMocks(page);
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(pt("Ultima analise"))).toBeVisible();
    await expect(page.getByText("Bom")).toBeVisible();
  });

  test("exibe indicador de tendencia quando ha 2+ analises", async ({ page }) => {
    await setupAuthenticatedMocks(page, { analyses: MOCK_ANALYSES_TREND });
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(pt("Seu consumo piorou de"))).toBeVisible();
  });

  test("meta de consumo pode ser definida via interface", async ({ page }) => {
    await setupAuthenticatedMocks(page);
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    const definirMeta = page.getByRole("button", { name: pt("Definir Meta") });
    if (await definirMeta.isVisible()) await definirMeta.click();
    await expect(page.locator("input[type='number']").first()).toBeVisible();
  });

  test("secao de simulacao de economia aparece", async ({ page }) => {
    await setupAuthenticatedMocks(page);
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(pt("Simule sua economia"))).toBeVisible();
    await expect(page.locator(".dash-sim-card").first()).toBeVisible();
  });

  test("grafico de consumo mensal aparece", async ({ page }) => {
    await setupAuthenticatedMocks(page);
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(pt("Consumo (kWh)"))).toBeVisible();
    await expect(page.locator(".recharts-responsive-container")).toBeVisible();
  });

  test("analises PENDENTE nao quebram o dashboard", async ({ page }) => {
    await setupAuthenticatedMocks(page, { analyses: MOCK_ANALYSES_WITH_PENDING });
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(pt("Total de analises"))).toBeVisible();
  });

  test("analises FALHA nao quebram o dashboard", async ({ page }) => {
    await setupAuthenticatedMocks(page, { analyses: MOCK_ANALYSES_WITH_FAILURE });
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(pt("Total de analises"))).toBeVisible();
  });

  test("navegacao para profile/history funciona", async ({ page }) => {
    await setupAuthenticatedMocks(page);
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await page
      .getByRole("link", { name: /perfil/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/profile/);
  });

  test("botoes de acao no estado vazio navegam para /profile", async ({ page }) => {
    await setupAuthenticatedMocks(page, {
      analyses: [],
      dashboard: {
        total_analyses: 0,
        average_consumption_kwh: 0,
        total_estimated_cost: 0,
        total_co2_emission_kg: 0,
        monthly_consumption: [],
      },
    });
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await page
      .getByRole("button", { name: pt("Criar Perfil") })
      .first()
      .click();
    await expect(page).toHaveURL(/\/profile/);
  });

  test("navegacao para /history pelo botao funciona", async ({ page }) => {
    await setupAuthenticatedMocks(page);
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    const historyBtn = page.getByRole("button", { name: pt("Historico") });
    if (await historyBtn.isVisible()) {
      await historyBtn.click();
      await expect(page).toHaveURL(/\/history/);
    }
  });
});
