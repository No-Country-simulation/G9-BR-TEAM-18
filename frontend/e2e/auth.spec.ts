import { test, expect } from "@playwright/test";
import { setupPublicMocks, MOCK_USER } from "./helpers/mocks";

test.describe("Autenticacao", () => {
  test.describe("Login", () => {
    test.beforeEach(async ({ page }) => {
      await setupPublicMocks(page);
      await page.goto("/login");
    });

    test("formulario de login renderiza campos corretamente", async ({ page }) => {
      await expect(page.getByLabel(/e-mail/i)).toBeVisible();
      await expect(page.getByLabel(/senha/i)).toBeVisible();
      await expect(page.getByRole("button", { name: /entrar/i })).toBeVisible();
    });

    test("mostra erro em credenciais invalidas", async ({ page }) => {
      await page.route(`http://localhost:8080/auth/login`, async (route) => {
        await route.fulfill({
          status: 401,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: "Credenciais invalidas" }),
        });
      });

      await page.getByLabel(/e-mail/i).fill("invalido@email.com");
      await page.getByLabel(/senha/i).fill("senhaerrada");
      await page.getByRole("button", { name: /entrar/i }).click();

      await expect(page.getByText(/credenciais invalidas|erro/i)).toBeVisible();
    });

    test("login com sucesso redireciona para home", async ({ page }) => {
      await page.route(`http://localhost:8080/auth/login`, async (route) => {
        await route.fulfill({
          status: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(MOCK_USER),
        });
      });

      await page.getByLabel(/e-mail/i).fill("teste@email.com");
      await page.getByLabel(/senha/i).fill("senha123");
      await page.getByRole("button", { name: /entrar/i }).click();

      await page.waitForURL(/\/$/);
    });

    test("login com passwordResetRequired redireciona para reset-password", async ({ page }) => {
      await page.route(`http://localhost:8080/auth/login`, async (route) => {
        await route.fulfill({
          status: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...MOCK_USER, password_reset_required: true }),
        });
      });
      await page.route(`http://localhost:8080/auth/me`, async (route) => {
        await route.fulfill({
          status: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...MOCK_USER, passwordResetRequired: true }),
        });
      });

      await page.getByLabel(/e-mail/i).fill("teste@email.com");
      await page.getByLabel(/senha/i).fill("senha123");
      await page.getByRole("button", { name: /entrar/i }).click();

      await page.waitForURL(/\/reset-password/);
    });

    test("botao de login mostra 'Entrando...' durante requisicao", async ({ page }) => {
      await page.route(`http://localhost:8080/auth/login`, async (route) => {
        await new Promise((r) => setTimeout(r, 500));
        await route.fulfill({ status: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify(MOCK_USER) });
      });

      await page.getByLabel(/e-mail/i).fill("teste@email.com");
      await page.getByLabel(/senha/i).fill("senha123");
      const btn = page.getByRole("button", { name: /entrar|entrando/i });
      await btn.click();
      await expect(btn).toBeDisabled();
    });
  });

  test.describe("Registro", () => {
    test.beforeEach(async ({ page }) => {
      await setupPublicMocks(page);
      await page.goto("/register");
    });

    test("formulario de registro renderiza campos corretamente", async ({ page }) => {
      await expect(page.getByLabel(/nome completo/i)).toBeVisible();
      await expect(page.getByLabel(/e-mail/i)).toBeVisible();
      // Using CSS locators for password fields since the label matches two elements
      await expect(page.locator("#password")).toBeVisible();
      await expect(page.locator("#confirm-password")).toBeVisible();
      await expect(page.getByRole("button", { name: /cadastrar/i })).toBeVisible();
    });

    test("valida senhas diferentes e mostra erro", async ({ page }) => {
      await page.getByLabel(/nome completo/i).fill("Teste");
      await page.getByLabel(/e-mail/i).fill("teste@email.com");
      await page.locator("#password").fill("senha123");
      await page.locator("#confirm-password").fill("senha456");
      await page.getByRole("button", { name: /cadastrar/i }).click();

      await expect(page.getByText(/senhas n[aã]o conferem/i)).toBeVisible();
    });

    test("registro com sucesso redireciona para home", async ({ page }) => {
      await page.route(`http://localhost:8080/auth/register`, async (route) => {
        await route.fulfill({ status: 201, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: "Usuario criado com sucesso" }) });
      });
      await page.route(`http://localhost:8080/auth/login`, async (route) => {
        await route.fulfill({ status: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify(MOCK_USER) });
      });

      await page.getByLabel(/nome completo/i).fill("Teste");
      await page.getByLabel(/e-mail/i).fill("teste@email.com");
      await page.locator("#password").fill("senha123");
      await page.locator("#confirm-password").fill("senha123");
      await page.getByRole("button", { name: /cadastrar/i }).click();

      await page.waitForURL(/\/$/);
    });

    test("registro mostra erro de API", async ({ page }) => {
      await page.route(`http://localhost:8080/auth/register`, async (route) => {
        await route.fulfill({ status: 400, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: "Email ja cadastrado" }) });
      });

      await page.getByLabel(/nome completo/i).fill("Teste");
      await page.getByLabel(/e-mail/i).fill("existente@email.com");
      await page.locator("#password").fill("senha123");
      await page.locator("#confirm-password").fill("senha123");
      await page.getByRole("button", { name: /cadastrar/i }).click();

      await expect(page.getByText(/email ja cadastrado|erro/i)).toBeVisible();
    });
  });

  test.describe("Rotas Privadas (redirecionamento)", () => {
    test.beforeEach(async ({ page }) => {
      await setupPublicMocks(page);
    });

    test("dashboard redireciona para login quando nao autenticado", async ({ page }) => {
      await page.goto("/dashboard");
      await page.waitForURL(/\/login/);
    });

    test("history redireciona para login quando nao autenticado", async ({ page }) => {
      await page.goto("/history");
      await page.waitForURL(/\/login/);
    });

    test("profile redireciona para login quando nao autenticado", async ({ page }) => {
      await page.goto("/profile");
      await page.waitForURL(/\/login/);
    });

    test("reset-password redireciona para login quando nao autenticado", async ({ page }) => {
      await page.goto("/reset-password");
      await page.waitForURL(/\/login/);
    });
  });
});
