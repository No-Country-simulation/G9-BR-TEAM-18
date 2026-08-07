import { test, expect } from "@playwright/test";
import { setupAuthenticatedMocks, setLoggedIn, MOCK_ANALYSES } from "./helpers/mocks";

test.describe("Historico - Detalhe e Modais", () => {
  test.beforeEach(async ({ page }) => {
    await setLoggedIn(page);
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

  test("detalhe abre como dialog acessivel e fecha com Escape (acessibilidade)", async ({
    page,
  }) => {
    await setupAuthenticatedMocks(page);
    await page.route(/\/analyses\/a1$/, async (route) => {
      await route.fulfill({
        json: { ...MOCK_ANALYSES[0] },
        headers: { "Content-Type": "application/json" },
      });
    });
    await page.goto("/history");
    await page.waitForLoadState("networkidle");
    // Abre o detalhe da primeira análise (ordem desc: a3, a2, a1)
    await page.locator(".history-item").nth(2).click();
    const dialog = page.getByRole("dialog", { name: /detalhes da an[aá]lise/i });
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute("aria-modal", "true");
    // Escape fecha o modal de detalhe e a lista permanece visível
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    await expect(page.locator(".history-item")).toHaveCount(3);
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

  test("modal de exclusao move foco para Cancelar e restaura ao fechar (acessibilidade)", async ({
    page,
  }) => {
    await setupAuthenticatedMocks(page);
    await page.goto("/history");
    await page.waitForLoadState("networkidle");
    const deleteBtn = page.locator(".history-item").first().locator(".history-item-delete");
    await deleteBtn.click();
    // Foco vai para o botão Cancelar ao abrir
    const cancelBtn = page.getByRole("button", { name: "Cancelar" });
    await expect(cancelBtn).toBeFocused();
    // Fechar restaura o foco para o botão de exclusão que abriu o modal
    await page.keyboard.press("Escape");
    await expect(deleteBtn).toBeFocused();
    await expect(page.locator(".history-item")).toHaveCount(3);
  });

  test("modal de exclusao confina o foco com Tab (focus trap)", async ({ page }) => {
    await setupAuthenticatedMocks(page);
    await page.goto("/history");
    await page.waitForLoadState("networkidle");
    await page.locator(".history-item").first().locator(".history-item-delete").click();
    const cancelBtn = page.getByRole("button", { name: "Cancelar" });
    const confirmBtn = page.getByRole("button", { name: /Sim, excluir/ });
    // Foco inicial no Cancelar (primeiro elemento focável)
    await expect(cancelBtn).toBeFocused();
    // Tab: primeiro -> último (Sim, excluir)
    await page.keyboard.press("Tab");
    await expect(confirmBtn).toBeFocused();
    // Tab: último -> primeiro (wrap)
    await page.keyboard.press("Tab");
    await expect(cancelBtn).toBeFocused();
    // Shift+Tab: primeiro -> último (wrap reverso)
    await page.keyboard.press("Shift+Tab");
    await expect(confirmBtn).toBeFocused();
    // O foco nunca escapa do diálogo (botão de exclusão da lista continua fora)
    await expect(page.locator(".history-item-delete").first()).not.toBeFocused();
  });

  test("detalhe da analise confina o foco com Tab (focus trap)", async ({ page }) => {
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
    const closeBtn = page.locator(".hist-modal-close");
    // Foco vai para o botão de fechar ao abrir
    await expect(closeBtn).toBeFocused();
    // Tab: único elemento focável do diálogo -> permanece nele (wrap)
    await page.keyboard.press("Tab");
    await expect(closeBtn).toBeFocused();
  });

  test("modal de exclusao aplica inert no conteudo de fundo (ARIA APG)", async ({ page }) => {
    await setupAuthenticatedMocks(page);
    await page.goto("/history");
    await page.waitForLoadState("networkidle");
    await page.locator(".history-item").first().locator(".history-item-delete").click();
    // Conteúdo de fundo fica inert enquanto o diálogo está aberto
    await expect(page.locator(".history-header")).toHaveAttribute("inert", "");
    // Escape fecha o modal e restaura o conteúdo de fundo
    await page.keyboard.press("Escape");
    await expect(page.locator(".history-header")).not.toHaveAttribute("inert", "");
    await expect(page.locator(".history-item")).toHaveCount(3);
  });

  test("detalhe da analise aplica inert no conteudo de fundo (ARIA APG)", async ({ page }) => {
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
    // Conteúdo de fundo fica inert enquanto o detalhe está aberto
    await expect(page.locator(".history-header")).toHaveAttribute("inert", "");
    // Escape fecha e restaura o conteúdo de fundo
    await page.keyboard.press("Escape");
    await expect(page.locator(".history-header")).not.toHaveAttribute("inert", "");
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
