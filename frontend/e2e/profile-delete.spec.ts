import { test, expect } from "@playwright/test";
import { setupAuthenticatedMocks, setLoggedIn, pt, MOCK_PROPERTY } from "./helpers/mocks";

test.describe("Profile Page - Exclusão de Imóvel (F073)", () => {
  test.beforeEach(async ({ page }) => {
    await setLoggedIn(page);
  });

  test("exclui imovel apos confirmacao no modal (F073)", async ({ page }) => {
    await setupAuthenticatedMocks(page);
    // Lista mutável: começa com o imóvel e esvazia após o DELETE (LIFO sobrescreve o mock base)
    let remainingProperties: unknown[] = [MOCK_PROPERTY];
    await page.route(`http://localhost:8080/properties`, async (route) => {
      await route.fulfill({
        json: remainingProperties,
        headers: { "Content-Type": "application/json" },
      });
    });
    await page.route(/\/properties\/10$/, async (route, request) => {
      if (request.method() === "DELETE") {
        remainingProperties = [];
        await route.fulfill({
          status: 204,
          headers: { "Content-Type": "application/json" },
        });
      } else {
        await route.fulfill({
          json: MOCK_PROPERTY,
          headers: { "Content-Type": "application/json" },
        });
      }
    });
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");
    // Abre o modal de confirmação
    await page.getByRole("button", { name: pt("Excluir imovel") }).click();
    await expect(page.getByText(pt("Excluir imovel?"))).toBeVisible();
    // Captura o DELETE e confirma
    const deleteRequest = page.waitForRequest(
      (req) => req.method() === "DELETE" && /\/properties\/10$/.test(req.url()),
    );
    await page.getByRole("button", { name: pt("Sim, excluir") }).click();
    const request = await deleteRequest;
    expect(request.url()).toMatch(/\/properties\/10$/);
    // Sem imóvel ativo, o botão de excluir some e o estado volta ao vazio
    await expect(page.getByRole("button", { name: pt("Excluir imovel") })).not.toBeVisible();
    await expect(page.getByRole("button", { name: pt("Salvar perfil do imovel") })).toBeEnabled();
  });

  test("cancelar exclusao mantem o imovel (F073)", async ({ page }) => {
    await setupAuthenticatedMocks(page);
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: pt("Excluir imovel") }).click();
    await expect(page.getByText(pt("Excluir imovel?"))).toBeVisible();
    await page.getByRole("button", { name: pt("Cancelar") }).click();
    await expect(page.getByText(pt("Excluir imovel?"))).not.toBeVisible();
    // Imóvel continua lá
    await expect(page.getByLabel(pt("Endereco"))).toHaveValue("Rua Exemplo, 123");
  });

  test("modal de exclusao fecha com tecla Escape (acessibilidade)", async ({ page }) => {
    await setupAuthenticatedMocks(page);
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");
    // Modal exposto como dialog (role + aria-modal)
    await page.getByRole("button", { name: pt("Excluir imovel") }).click();
    const dialog = page.getByRole("dialog", { name: /exclus[aáã]o de im[oó]vel/i });
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute("aria-modal", "true");
    // Escape fecha o modal
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    // Imóvel continua intacto
    await expect(page.getByLabel(pt("Endereco"))).toHaveValue("Rua Exemplo, 123");
  });

  test("modal de exclusao confina o foco com Tab (focus trap)", async ({ page }) => {
    await setupAuthenticatedMocks(page);
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: pt("Excluir imovel") }).click();
    const cancelBtn = page.getByRole("button", { name: pt("Cancelar") });
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
    // Imóvel continua intacto após navegação por teclado
    await expect(page.getByLabel(pt("Endereco"))).toHaveValue("Rua Exemplo, 123");
  });

  test("modal de exclusao aplica inert no conteudo de fundo (ARIA APG)", async ({ page }) => {
    await setupAuthenticatedMocks(page);
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: pt("Excluir imovel") }).click();
    // Conteúdo de fundo (página do perfil) fica inert enquanto o diálogo está aberto
    await expect(page.locator(".profile-page")).toHaveAttribute("inert", "");
    // Escape fecha o modal e restaura o conteúdo de fundo
    await page.keyboard.press("Escape");
    await expect(page.locator(".profile-page")).not.toHaveAttribute("inert", "");
    // Imóvel continua intacto
    await expect(page.getByLabel(pt("Endereco"))).toHaveValue("Rua Exemplo, 123");
  });

  test("modal de exclusao move foco para Cancelar e restaura ao fechar (acessibilidade)", async ({
    page,
  }) => {
    await setupAuthenticatedMocks(page);
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");
    const deleteBtn = page.getByRole("button", { name: pt("Excluir imovel") });
    await deleteBtn.click();
    // Foco vai para o botão Cancelar ao abrir o modal
    const cancelBtn = page.getByRole("button", { name: pt("Cancelar") });
    await expect(cancelBtn).toBeFocused();
    // Fechar (Escape) restaura o foco para o botão que abriu o modal
    await page.keyboard.press("Escape");
    await expect(deleteBtn).toBeFocused();
    // Imóvel continua intacto
    await expect(page.getByLabel(pt("Endereco"))).toHaveValue("Rua Exemplo, 123");
  });
});
