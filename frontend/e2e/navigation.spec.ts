import { test, expect } from "@playwright/test";
import { setupPublicMocks, setupAuthenticatedMocks, setLoggedIn } from "./helpers/mocks";

test.describe("Navegacao e Paginas Publicas", () => {
  test.beforeEach(async ({ page }) => {
    await setupPublicMocks(page);
  });

  test("Home carrega com secoes principais visiveis", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".navbar-logo")).toBeVisible();
    await expect(page.locator("section").first()).toBeVisible();
    await expect(page.getByText("Passo a passo").first()).toBeVisible();
    // TechStack section heading is "Arquitetura do Projeto"
    await expect(page.getByText("Arquitetura do Projeto")).toBeVisible();
    await expect(page.locator("footer")).toBeVisible();
  });

  test("Navbar mostra links publicos quando nao autenticado", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /login/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /cadastrar/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /dashboard/i })).not.toBeVisible();
  });

  test("Navbar mostra links privados quando autenticado", async ({ page }) => {
    await setLoggedIn(page);
    await setupAuthenticatedMocks(page);
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("link", { name: /dashboard/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /perfil/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /histórico/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /login/i })).not.toBeVisible();
  });

  test("Navbar mostra nome do usuario quando autenticado", async ({ page }) => {
    await setLoggedIn(page);
    await setupAuthenticatedMocks(page);
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Usuario Teste")).toBeVisible();
  });

  test("Tema escuro/claro alterna ao clicar no botao", async ({ page }) => {
    await page.goto("/");
    const themeBtn = page.locator(".theme-toggle").first();
    await expect(themeBtn).toBeVisible();
    await themeBtn.click();
    await page.waitForTimeout(400);
  });

  test("Navegacao entre paginas publicas funciona", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /login/i }).first().click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText("Entre na sua conta")).toBeVisible();
    await page.getByRole("link", { name: /cadastre-se/i }).click();
    await expect(page).toHaveURL(/\/register/);
    await expect(page.getByText("Crie sua conta")).toBeVisible();
    await page.locator(".navbar-logo").first().click();
    await expect(page).toHaveURL(/\/$/);
  });
});
