import { test, expect } from "@playwright/test";
import {
  setupAuthenticatedMocks,
  setLoggedIn,
  pt,
  MOCK_ANALYSES,
  MOCK_ANALYSES_WITH_PENDING,
  MOCK_ANALYSES_WITH_FAILURE,
} from "./helpers/mocks";

test.describe("Historico", () => {
  test.beforeEach(async ({ page }) => {
    await setLoggedIn(page);
  });

  test("mostra loading state inicial", async ({ page }) => {
    await setupAuthenticatedMocks(page);
    await page.route(`http://localhost:8080/analyses`, async (route) => {
      // Janela generosa para o loading state ser renderizado (evita flakiness)
      await new Promise((r) => setTimeout(r, 1500));
      await route.fulfill({ json: MOCK_ANALYSES, headers: { "Content-Type": "application/json" } });
    });
    await page.goto("/history");
    await expect(page.getByText(pt("Carregando historico"))).toBeVisible();
  });

  test("mostra estado vazio quando nao ha analises", async ({ page }) => {
    await setupAuthenticatedMocks(page, { analyses: [] });
    await page.goto("/history");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(pt("Nenhuma analise encontrada"))).toBeVisible();
    await expect(page.getByRole("button", { name: pt("Fazer primeira analise") })).toBeVisible();
  });

  test("lista analises corretamente", async ({ page }) => {
    await setupAuthenticatedMocks(page);
    await page.goto("/history");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(pt("Historico")).first()).toBeVisible();
    await expect(page.locator(".history-item")).toHaveCount(3);
  });

  test("exibe categoria, consumo e custo de cada analise", async ({ page }) => {
    await setupAuthenticatedMocks(page);
    await page.goto("/history");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(/320/)).toBeVisible();
    await expect(page.getByText(/280/)).toBeVisible();
    await expect(page.getByText(/260/)).toBeVisible();
    await expect(page.getByText(/R\$ 240/)).toBeVisible();
    await expect(page.getByText(/R\$ 210/)).toBeVisible();
    await expect(page.getByText(/R\$ 195/)).toBeVisible();
  });

  test("exibe badge de status CONCLUIDA", async ({ page }) => {
    await setupAuthenticatedMocks(page);
    await page.goto("/history");
    await page.waitForLoadState("networkidle");
    await expect(page.locator(".history-item-cat").first()).toBeVisible();
  });

  test("exibe badge de status PENDENTE corretamente", async ({ page }) => {
    await setupAuthenticatedMocks(page, { analyses: MOCK_ANALYSES_WITH_PENDING });
    await page.goto("/history");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(/pendente/i)).toBeVisible();
  });

  test("exibe badge de status FALHA corretamente", async ({ page }) => {
    await setupAuthenticatedMocks(page, { analyses: MOCK_ANALYSES_WITH_FAILURE });
    await page.goto("/history");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(/falha/i)).toBeVisible();
  });

  test("nao quebra com status desconhecido", async ({ page }) => {
    const unknown = MOCK_ANALYSES.map((a, i) => (i === 0 ? { ...a, status: "DESCONHECIDO" } : a));
    await setupAuthenticatedMocks(page, { analyses: unknown });
    await page.goto("/history");
    await page.waitForLoadState("networkidle");
    await expect(page.locator(".history-item")).toHaveCount(3);
  });

  test("voltar navega para /dashboard", async ({ page }) => {
    await setupAuthenticatedMocks(page);
    await page.goto("/history");
    await page.waitForLoadState("networkidle");
    await page
      .getByRole("button", { name: /voltar/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("botao 'Nova analise' navega para /profile", async ({ page }) => {
    await setupAuthenticatedMocks(page);
    await page.goto("/history");
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: pt("Nova analise") }).click();
    await expect(page).toHaveURL(/\/profile/);
  });

  test("formata data corretamente no padrao pt-BR", async ({ page }) => {
    await setupAuthenticatedMocks(page);
    await page.goto("/history");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(/20 de jul/i)).toBeVisible();
    await expect(page.getByText(/25 de jul/i)).toBeVisible();
  });

  test("lista vazia com navegacao para profile", async ({ page }) => {
    await setupAuthenticatedMocks(page, { analyses: [] });
    await page.goto("/history");
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: pt("Fazer primeira analise") }).click();
    await expect(page).toHaveURL(/\/profile/);
  });

  test("exibe top produtos consumidores no card (F073)", async ({ page }) => {
    await setupAuthenticatedMocks(page);
    await page.goto("/history");
    await page.waitForLoadState("networkidle");
    // a1 tem highest_consumption_products: ["Ar Condicionado", "Geladeira"]
    await expect(page.getByText(pt("Maiores consumidores")).first()).toBeVisible();
    await expect(page.getByText("Ar Condicionado").first()).toBeVisible();
    await expect(page.getByText("Geladeira").first()).toBeVisible();
  });

  test("detalhe exibe badge de fonte ML e FALLBACK (F073)", async ({ page }) => {
    await setupAuthenticatedMocks(page);
    // Detalhes: GET /analyses/{id} (LIFO apos setup)
    await page.route(/\/analyses\/a1$/, async (route) => {
      await route.fulfill({
        json: { ...MOCK_ANALYSES[0] },
        headers: { "Content-Type": "application/json" },
      });
    });
    await page.route(/\/analyses\/a2$/, async (route) => {
      await route.fulfill({
        json: { ...MOCK_ANALYSES[1] },
        headers: { "Content-Type": "application/json" },
      });
    });
    await page.goto("/history");
    await page.waitForLoadState("networkidle");
    // Lista ordenada desc por created_at: a3 (index 0), a2 (index 1), a1 (index 2)
    await page.locator(".history-item").nth(2).click();
    await expect(page.locator(".hist-modal .analysis-source-badge")).toContainText("Modelo ML");
    await page.locator(".hist-modal-close").click();
    await page.locator(".history-item").nth(1).click();
    await expect(page.locator(".hist-modal .analysis-source-badge")).toContainText("Fallback");
  });

  test("detalhe exibe updated_at quando diferente de created_at (F073)", async ({ page }) => {
    await setupAuthenticatedMocks(page);
    await page.route(/\/analyses\/a1$/, async (route) => {
      await route.fulfill({
        json: { ...MOCK_ANALYSES[0] },
        headers: { "Content-Type": "application/json" },
      });
    });
    await page.goto("/history");
    await page.waitForLoadState("networkidle");
    await page.locator(".history-item").nth(2).click();
    await expect(page.getByText(/atualizado em/i)).toBeVisible();
  });

  test("detalhe sem updated_at nem source nao quebra (contrato anterior)", async ({ page }) => {
    await setupAuthenticatedMocks(page);
    // a3 (index 0 na ordem desc) nao tem updated_at nem source
    await page.route(/\/analyses\/a3$/, async (route) => {
      await route.fulfill({
        json: { ...MOCK_ANALYSES[2] },
        headers: { "Content-Type": "application/json" },
      });
    });
    await page.goto("/history");
    await page.waitForLoadState("networkidle");
    await page.locator(".history-item").first().click();
    await expect(page.locator(".hist-modal")).toBeVisible();
    await expect(page.locator(".hist-modal .analysis-source-badge")).toHaveCount(0);
    await expect(page.getByText(/atualizado em/i)).toHaveCount(0);
  });

  test("modal de exclusao de analise fecha com tecla Escape (acessibilidade)", async ({ page }) => {
    await setupAuthenticatedMocks(page);
    await page.goto("/history");
    await page.waitForLoadState("networkidle");
    // Abre o modal de exclusão da primeira análise
    await page.locator(".history-item").first().locator(".history-item-delete").click();
    const dialog = page.getByRole("dialog", { name: /exclus[aáã]o de an[aá]lise/i });
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute("aria-modal", "true");
    // Escape fecha o modal e a análise permanece na lista
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    await expect(page.locator(".history-item")).toHaveCount(3);
  });
});
