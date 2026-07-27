import type { Page, Route } from "@playwright/test";

/* =========================================================================
 * Mock API responses matching the backend contracts
 * ========================================================================= */

/* ---------- mock users ---------- */
export const MOCK_USER = {
  id: "1",
  name: "Usuario Teste",
  email: "teste@email.com",
};

export const MOCK_USER_NEEDS_RESET = {
  ...MOCK_USER,
  password_reset_required: true,
};

/* ---------- mock categories ---------- */
export const MOCK_CATEGORIES = [
  "EXCELENTE",
  "BOM",
  "MEDIANO",
  "RUIM",
  "CRITICO",
];

/* ---------- mock appliances ---------- */
export const MOCK_APPLIANCES = [
  { id: 1, name: "Geladeira", appliance_category: "Refrigeracao", average_power_watts: 150, average_daily_use_hours: 24 },
  { id: 2, name: "Ar Condicionado", appliance_category: "Climatizacao", average_power_watts: 1400, average_daily_use_hours: 8 },
  { id: 3, name: "Televisao", appliance_category: "Tecnologia", average_power_watts: 120, average_daily_use_hours: 5 },
  { id: 4, name: "Lampada LED", appliance_category: "Iluminacao", average_power_watts: 10, average_daily_use_hours: 6 },
  { id: 5, name: "Maquina de Lavar", appliance_category: "Eletrodomesticos", average_power_watts: 500, average_daily_use_hours: 1 },
  { id: 6, name: "Bomba d'Agua", appliance_category: "Servicos", average_power_watts: 750, average_daily_use_hours: 2 },
];

/* ---------- mock property ---------- */
export const MOCK_PROPERTY = {
  id: 10, alias: "Minha Residencia", property_type: "RESIDENCIAL", active: true,
  address: "Rua Exemplo, 123", resident_count: 3, area_sqm: 80,
};

/* ---------- mock property appliances ---------- */
export const MOCK_PROPERTY_APPLIANCES = [
  { id: 1, appliance_id: 1, appliance_name: "Geladeira", appliance_category: "Refrigeracao", quantity: 1, average_power_watts: 150, average_daily_use_hours: 24, estimated_monthly_consumption_kwh: 108 },
  { id: 2, appliance_id: 2, appliance_name: "Ar Condicionado", appliance_category: "Climatizacao", quantity: 2, average_power_watts: 1400, average_daily_use_hours: 8, estimated_monthly_consumption_kwh: 672 },
];

/* ---------- mock analysis response ---------- */
export const MOCK_ANALYSIS_RESULT = {
  category: "BOM", probability: 0.78,
  recommendations: ["Troque lampadas incandescentes por LED para economizar ate 80%.", "Evite usar ar-condicionado com portas e janelas abertas."],
  estimated_monthly_cost: 180.5, status: "CONCLUIDA",
};

/* ---------- mock analyses history ---------- */
export const MOCK_ANALYSES = [
  { id: "a1", category: "MEDIANO", probability: 0.65, consumption_kwh: 320, estimated_monthly_cost: 240, peak_hour_usage: true, high_consumption_hours: 6, created_at: "2026-07-20T10:00:00Z", recommendations: [], status: "CONCLUIDA" },
  { id: "a2", category: "BOM", probability: 0.78, consumption_kwh: 280, estimated_monthly_cost: 210, peak_hour_usage: false, high_consumption_hours: 4, created_at: "2026-07-22T14:30:00Z", recommendations: [], status: "CONCLUIDA" },
  { id: "a3", category: "BOM", probability: 0.81, consumption_kwh: 260, estimated_monthly_cost: 195, peak_hour_usage: false, high_consumption_hours: 3, created_at: "2026-07-25T09:15:00Z", recommendations: [], status: "CONCLUIDA" },
];

export const MOCK_ANALYSES_WITH_PENDING = [
  ...MOCK_ANALYSES,
  { id: "a4", category: "EXCELENTE", probability: 0.72, consumption_kwh: 200, estimated_monthly_cost: 150, peak_hour_usage: false, high_consumption_hours: 2, created_at: "2026-07-26T08:00:00Z", recommendations: [], status: "PENDENTE" },
];

export const MOCK_ANALYSES_WITH_FAILURE = [
  ...MOCK_ANALYSES,
  { id: "a5", category: "EXCELENTE", probability: 0.7, consumption_kwh: 190, estimated_monthly_cost: 142.5, peak_hour_usage: false, high_consumption_hours: 2, created_at: "2026-07-26T09:00:00Z", recommendations: [], status: "FALHA" },
];

/* ---------- mock dashboard data ---------- */
export const MOCK_DASHBOARD = {
  total_analyses: 3, average_consumption_kwh: 286.67, total_estimated_cost: 645, total_co2_emission_kg: 27.52,
  monthly_consumption: [
    { month: "Jan", consumption_kwh: 300 }, { month: "Fev", consumption_kwh: 280 },
    { month: "Mar", consumption_kwh: 320 }, { month: "Abr", consumption_kwh: 260 },
    { month: "Mai", consumption_kwh: 290 }, { month: "Jun", consumption_kwh: 270 },
  ],
};

/* =========================================================================
 * Helper: make regex accent-insensitive for PT-BR
 * Use:  await expect(page.getByText(pt("Dados do imovel"))).toBeVisible();
 * ========================================================================= */
export function pt(text: string): RegExp {
  const map: Record<string, string> = {
    a: "[a\u00E1\u00E0\u00E2\u00E3]", e: "[e\u00E9\u00E8\u00EA]", i: "[i\u00ED\u00EC]", o: "[o\u00F3\u00F2\u00F4\u00F5]",
    u: "[u\u00FA\u00F9\u00FB]", c: "[c\u00E7]",
    A: "[A\u00C1\u00C0\u00C2\u00C3]", E: "[E\u00C9\u00C8\u00CA]",
    I: "[I\u00CD\u00CC]", O: "[O\u00D3\u00D2\u00D4\u00D5]",
    U: "[U\u00DA\u00D9\u00DB]", C: "[C\u00C7]",
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
    await route.fulfill({ status: 401, headers: JSON_HEADERS, body: JSON.stringify({ message: "Unauthorized" }) });
  });
}

/* =========================================================================
 * Helper: set up API mocks for an authenticated user with full data
 * ========================================================================= */
export async function setupAuthenticatedMocks(
  page: Page,
  options?: {
    analyses?: typeof MOCK_ANALYSES; dashboard?: typeof MOCK_DASHBOARD;
    properties?: typeof MOCK_PROPERTY[]; propertyAppliances?: typeof MOCK_PROPERTY_APPLIANCES;
  },
) {
  const {
    analyses = MOCK_ANALYSES, dashboard = MOCK_DASHBOARD,
    properties = [MOCK_PROPERTY], propertyAppliances = MOCK_PROPERTY_APPLIANCES,
  } = options ?? {};

  const JSON_HEADERS = { "Content-Type": "application/json" };

  await page.route(`http://localhost:8080/auth/me`, async (route: Route) => {
    await route.fulfill({ status: 200, headers: JSON_HEADERS, body: JSON.stringify(MOCK_USER) });
  });
  await page.route(`http://localhost:8080/appliances`, async (route: Route) => {
    await route.fulfill({ json: MOCK_APPLIANCES, headers: JSON_HEADERS });
  });
  await page.route(`http://localhost:8080/energy-analysis/categories`, async (route: Route) => {
    await route.fulfill({ json: MOCK_CATEGORIES, headers: JSON_HEADERS });
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
}

/* =========================================================================
 * Helper: simulate logged-in state via localStorage (uses addInitScript
 * to set localStorage BEFORE page JS runs, avoiding SecurityError)
 * ========================================================================= */
export async function setLoggedIn(page: Page) {
  await page.addInitScript(
    (user: { id: string; name: string; email: string }) => {
      localStorage.setItem("energiai_user", JSON.stringify(user));
      document.cookie = "SESSION_TOKEN=mock-session-token; Path=/;";
    },
    MOCK_USER,
  );
}
