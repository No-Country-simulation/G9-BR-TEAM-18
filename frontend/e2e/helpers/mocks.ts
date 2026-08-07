import type { Page, Route } from "@playwright/test";
import {
  MOCK_ANALYSES,
  MOCK_ANALYSIS_RESULT,
  MOCK_APPLIANCES,
  MOCK_CATEGORIES,
  MOCK_CONTRACT_INFO,
  MOCK_DASHBOARD,
  MOCK_PROPERTY,
  MOCK_PROPERTY_APPLIANCES,
  MOCK_USER,
  MOCK_USER_PREFS,
} from "./mock-data";

export * from "./mock-data";

/* =========================================================================
 * Helper: make regex accent-insensitive for PT-BR
 * Use:  await expect(page.getByText(pt("Dados do imovel"))).toBeVisible();
 * ========================================================================= */
export function pt(text: string): RegExp {
  const map: Record<string, string> = {
    a: "[a\u00E1\u00E0\u00E2\u00E3]",
    e: "[e\u00E9\u00E8\u00EA]",
    i: "[i\u00ED\u00EC]",
    o: "[o\u00F3\u00F2\u00F4\u00F5]",
    u: "[u\u00FA\u00F9\u00FB]",
    c: "[c\u00E7]",
    A: "[A\u00C1\u00C0\u00C2\u00C3]",
    E: "[E\u00C9\u00C8\u00CA]",
    I: "[I\u00CD\u00CC]",
    O: "[O\u00D3\u00D2\u00D4\u00D5]",
    U: "[U\u00DA\u00D9\u00DB]",
    C: "[C\u00C7]",
  };
  let pattern = "";
  for (const ch of text) {
    pattern += map[ch] || ch.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
  }
  return new RegExp(pattern, "i");
}

/* =========================================================================
 * Helper: set up API mocks for an unauthenticated user
 * ========================================================================= */
export async function setupPublicMocks(page: Page) {
  const JSON_HEADERS = { "Content-Type": "application/json" };
  await page.route(`http://localhost:8080/auth/me`, async (route: Route) => {
    await route.fulfill({
      status: 401,
      headers: JSON_HEADERS,
      body: JSON.stringify({ message: "Unauthorized" }),
    });
  });
}

/* =========================================================================
 * Helper: set up API mocks for an authenticated user with full data
 * ========================================================================= */
export async function setupAuthenticatedMocks(
  page: Page,
  options?: {
    analyses?: typeof MOCK_ANALYSES;
    dashboard?: typeof MOCK_DASHBOARD;
    properties?: (typeof MOCK_PROPERTY)[];
    propertyAppliances?: typeof MOCK_PROPERTY_APPLIANCES;
    prefs?: Partial<typeof MOCK_USER_PREFS>;
  },
) {
  const {
    analyses = MOCK_ANALYSES,
    dashboard = MOCK_DASHBOARD,
    properties = [MOCK_PROPERTY],
    propertyAppliances = MOCK_PROPERTY_APPLIANCES,
    prefs = MOCK_USER_PREFS,
  } = options ?? {};

  const JSON_HEADERS = { "Content-Type": "application/json" };

  await page.route(`http://localhost:8080/auth/me`, async (route: Route) => {
    await route.fulfill({
      status: 200,
      headers: JSON_HEADERS,
      // F069 / ADR-0046: /auth/me expõe as preferências do usuário (B051)
      body: JSON.stringify({ ...MOCK_USER, ...prefs }),
    });
  });
  await page.route(`http://localhost:8080/appliances`, async (route: Route) => {
    await route.fulfill({ json: MOCK_APPLIANCES, headers: JSON_HEADERS });
  });
  await page.route(`http://localhost:8080/energy-analysis/categories`, async (route: Route) => {
    await route.fulfill({ json: MOCK_CATEGORIES, headers: JSON_HEADERS });
  });
  await page.route(`http://localhost:8080/contract-info`, async (route: Route) => {
    await route.fulfill({ json: MOCK_CONTRACT_INFO, headers: JSON_HEADERS });
  });
  await page.route(`http://localhost:8080/properties`, async (route: Route, request) => {
    if (request.method() === "POST") {
      await route.fulfill({ status: 201, json: MOCK_PROPERTY, headers: JSON_HEADERS });
    } else {
      await route.fulfill({ json: properties, headers: JSON_HEADERS });
    }
  });
  await page.route(/\/properties\/\d+$/, async (route: Route) => {
    await route.fulfill({ json: MOCK_PROPERTY, headers: JSON_HEADERS });
  });
  await page.route(/\/properties\/\d+\/appliances$/, async (route: Route, request) => {
    if (request.method() === "POST" || request.method() === "PUT") {
      await route.fulfill({ status: 200, json: propertyAppliances, headers: JSON_HEADERS });
    } else {
      await route.fulfill({ json: propertyAppliances, headers: JSON_HEADERS });
    }
  });
  await page.route(/\/properties\/\d+\/appliances\/batch$/, async (route: Route) => {
    await route.fulfill({ status: 200, json: propertyAppliances, headers: JSON_HEADERS });
  });
  await page.route(`http://localhost:8080/analyses`, async (route: Route) => {
    await route.fulfill({ json: analyses, headers: JSON_HEADERS });
  });
  await page.route(`http://localhost:8080/dashboard`, async (route: Route) => {
    await route.fulfill({ json: dashboard, headers: JSON_HEADERS });
  });
  await page.route(`http://localhost:8080/energy-analysis`, async (route: Route) => {
    await route.fulfill({ status: 201, json: MOCK_ANALYSIS_RESULT, headers: JSON_HEADERS });
  });
  await page.route(`http://localhost:8080/auth/preferences`, async (route: Route) => {
    await route.fulfill({ status: 200, headers: JSON_HEADERS, body: "{}" });
  });
}

/* =========================================================================
 * Helper: simulate logged-in state via localStorage (uses addInitScript
 * to set localStorage BEFORE page JS runs, avoiding SecurityError)
 * ========================================================================= */
export async function setLoggedIn(page: Page) {
  await page.addInitScript((user: { id: string; name: string; email: string }) => {
    localStorage.setItem("energiai_user", JSON.stringify(user));
    document.cookie = "SESSION_TOKEN=mock-session-token; Path=/;";
  }, MOCK_USER);
}
