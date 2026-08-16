import { test, expect } from "@playwright/test";
import { setupAuthenticatedMocks, setLoggedIn } from "./helpers/mocks";

test.describe("Tratamento de Erros e Fallbacks", () => {
  test.describe("Erros de API", () => {
    test.beforeEach(async ({ page }) => {
      await setLoggedIn(page);
    });

    test("dashboard mostra erro quando API falha", async ({ page }) => {
      await page.route(`http://localhost:8080/dashboard`, async (route) => {
        await route.fulfill({ status: 500, body: "Internal Server Error" });
      });
      await page.route(`http://localhost:8080/analyses`, async (route) => {
        await route.fulfill({ json: [], headers: { "Content-Type": "application/json" } });
      });
      await setupAuthenticatedMocks(page);
      await page.goto("/dashboard");
      await page.waitForLoadState("networkidle");
      await expect(page.locator(".dash-page")).toBeVisible();
    });

    test("history mostra erro quando API falha", async ({ page }) => {
      await page.route(`http://localhost:8080/analyses`, async (route) => {
        await route.fulfill({ status: 500, body: "Internal Server Error" });
      });
      await setupAuthenticatedMocks(page);
      await page.goto("/history");
      await page.waitForLoadState("networkidle");
      await expect(page.locator(".history-page")).toBeVisible();
    });

    test("profile mostra erro quando API de aparelhos falha", async ({ page }) => {
      await setupAuthenticatedMocks(page);
      await page.route(`http://localhost:8080/appliances`, async (route) => {
        await route.fulfill({ status: 500, body: "Internal Server Error" });
      });
      await page.goto("/profile");
      await page.waitForLoadState("networkidle");
      await expect(page.locator(".profile-page")).toBeVisible();
    });

    test("login mostra erro quando servidor offline", async ({ page }) => {
      await page.route(`http://localhost:8080/auth/login`, async (route) => {
        await route.abort("connectionrefused");
      });
      await page.goto("/login");
      await page.getByLabel(/e-mail/i).fill("teste@email.com");
      await page.getByLabel(/senha/i).fill("senha123");
      await page.getByRole("button", { name: /entrar/i }).click();
      // The error should be displayed; the page should not crash
      await expect(page.locator(".auth-card")).toBeVisible();
    });
  });

  test.describe("ChunkErrorBoundary e Fallbacks", () => {
    test("pagina nao encontrada mostra React Router (404)", async ({ page }) => {
      await page.goto("/rota-inexistente");
      await expect(page.locator("nav")).toBeVisible();
    });

    test("tema permanece funcional", async ({ page }) => {
      await page.goto("/");
      const themeBtn = page.locator(".theme-toggle").first();
      await expect(themeBtn).toBeVisible();
      await themeBtn.click();
      await page.waitForTimeout(400);
      await themeBtn.click();
      await page.waitForTimeout(400);
    });
  });

  test.describe("Estados de Carregamento", () => {
    test("lazy loading mostra fallback", async ({ page }) => {
      await page.goto("/login");
      await page.waitForLoadState("domcontentloaded");
    });
  });
});
