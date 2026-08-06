import { test, expect } from "@playwright/test";
import {
  setupAuthenticatedMocks,
  setLoggedIn,
  pt,
  MOCK_APPLIANCES,
  MOCK_PROPERTY_APPLIANCES,
  MOCK_PROPERTY,
} from "./helpers/mocks";

test.describe("Profile Page", () => {
  test.beforeEach(async ({ page }) => {
    await setLoggedIn(page);
  });

  test("mostra loading state inicial", async ({ page }) => {
    await setupAuthenticatedMocks(page);
    await page.route(`http://localhost:8080/appliances`, async (route) => {
      // Janela generosa para o loading state ser renderizado (evita flakiness)
      await new Promise((r) => setTimeout(r, 1500));
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

  test("salvar perfil envia appliance_id real do catalogo no batch update (B052)", async ({
    page,
  }) => {
    await setupAuthenticatedMocks(page);
    // Register AFTER setup so this route takes precedence (LIFO)
    await page.route(/\/properties\/\d+\/appliances\/batch$/, async (route) => {
      await route.fulfill({
        status: 200,
        json: MOCK_PROPERTY_APPLIANCES,
        headers: { "Content-Type": "application/json" },
      });
    });
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");
    // Adiciona Televisao (id 3 no catalogo)
    await page.getByRole("button", { name: pt("Adicionar Televisao") }).click();
    // Dispara o save e aguarda deterministicamente o request do batch (evita race)
    const batchRequest = page.waitForRequest(
      (req) => req.method() === "PUT" && /appliances\/batch$/.test(req.url()),
    );
    await page.getByRole("button", { name: pt("Salvar perfil do imovel") }).click();
    const request = await batchRequest;
    const parsed = JSON.parse(request.postData() ?? "[]");
    expect(Array.isArray(parsed)).toBe(true);
    const tv = parsed.find((x) => x.appliance_id === 3);
    expect(tv).toBeDefined();
    expect(tv.quantity).toBe(1);
    // Garante que NAO e NaN/string slug: id real numerico do backend
    expect(Number.isNaN(Number(tv.appliance_id))).toBe(false);
    // Save concluiu sem erro (botao voltou a ficar habilitado)
    await expect(page.getByRole("button", { name: pt("Salvar perfil do imovel") })).toBeEnabled();
  });

  test("salvar perfil persiste peak_hour_usage e high_consumption_hours no PUT /auth/preferences (F069)", async ({
    page,
  }) => {
    await setupAuthenticatedMocks(page);
    // Captura o PUT de preferências (rota registrada após o setup -> LIFO)
    const prefsRequest = page.waitForRequest(
      (req) => req.method() === "PUT" && /\/auth\/preferences$/.test(req.url()),
    );
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");
    // Marca o checkbox de pico e ajusta as horas de alto consumo
    await page.getByLabel(/uso em hor[aá]rio de pico/i).check();
    await page.getByLabel(/horas de alto consumo/i).fill("4.5");
    await page.getByRole("button", { name: pt("Salvar perfil do imovel") }).click();
    const request = await prefsRequest;
    const parsed = JSON.parse(request.postData() ?? "{}");
    // Contrato completo de preferências (B051): regularity + campos F069
    expect(parsed.regularity).toBe("instantanea");
    expect(parsed.peak_hour_usage).toBe(true);
    expect(parsed.high_consumption_hours).toBe(4.5);
    await expect(page.getByRole("button", { name: pt("Salvar perfil do imovel") })).toBeEnabled();
  });

  test("recarrega preferencias de pico e horas salvas do GET /auth/me (F069)", async ({ page }) => {
    // Backend (B051) devolve os campos salvos em /auth/me
    await setupAuthenticatedMocks(page, {
      prefs: { peak_hour_usage: true, high_consumption_hours: 4.5 },
    });
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");
    // Checkbox reflete o valor persistido após o reload
    await expect(page.getByLabel(/uso em hor[aá]rio de pico/i)).toBeChecked();
    await expect(page.getByLabel(/horas de alto consumo/i)).toHaveValue("4.5");
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
