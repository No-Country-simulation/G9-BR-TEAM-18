/* =========================================================================
 * Mock API data matching the backend contracts
 * ========================================================================= */

/* ---------- mock users ---------- */
export const MOCK_USER = {
  id: "1",
  name: "Usuario Teste",
  email: "teste@email.com",
};

/* ---------- mock user preferences (F069 / ADR-0046, contrato B051) ---------- */
export const MOCK_USER_PREFS = {
  consumption_goal: 250,
  regularity: "instantanea",
  peak_hour_usage: false,
  high_consumption_hours: 6,
};

/* ---------- mock categories (uso interno) ---------- */
export const MOCK_CATEGORIES = ["EXCELENTE", "BOM", "MEDIANO", "RUIM", "CRITICO"];

/* ---------- mock contract-info (F063 / ADR-0027) ---------- */
export const MOCK_CONTRACT_INFO = {
  property_types: ["RESIDENCIAL", "APARTAMENTO", "COMERCIAL"],
  consumption_categories: [
    "REFRIGERATION",
    "CLIMATE_CONTROL",
    "TECHNOLOGY",
    "LIGHTING",
    "APPLIANCES",
    "SERVICES",
    "OTHERS",
  ],
  efficiency_categories: MOCK_CATEGORIES,
};

/* ---------- mock appliances (contrato ADR-0027 + id real desde B052/ADR-0048) ---------- */
export const MOCK_APPLIANCES = [
  {
    id: 1,
    name: "Geladeira",
    ml_category: "REFRIGERATION",
    watts: 150,
    hours: 24,
  },
  {
    id: 2,
    name: "Ar Condicionado",
    ml_category: "CLIMATE_CONTROL",
    watts: 1400,
    hours: 8,
  },
  {
    id: 3,
    name: "Televisao",
    ml_category: "TECHNOLOGY",
    watts: 120,
    hours: 5,
  },
  {
    id: 4,
    name: "Lampada LED",
    ml_category: "LIGHTING",
    watts: 10,
    hours: 6,
  },
  {
    id: 5,
    name: "Maquina de Lavar",
    ml_category: "APPLIANCES",
    watts: 500,
    hours: 1,
  },
  {
    id: 6,
    name: "Bomba d'Agua",
    ml_category: "SERVICES",
    watts: 750,
    hours: 2,
  },
];

/* ---------- mock property ---------- */
export const MOCK_PROPERTY = {
  id: 10,
  alias: "Minha Residencia",
  property_type: "RESIDENCIAL",
  active: true,
  address: "Rua Exemplo, 123",
  resident_count: 3,
  area_sqm: 80,
};

/* ---------- mock property appliances ---------- */
export const MOCK_PROPERTY_APPLIANCES = [
  {
    id: 1,
    appliance_id: 1,
    appliance_name: "Geladeira",
    appliance_category: "REFRIGERATION",
    quantity: 1,
    average_power_watts: 150,
    average_daily_use_hours: 24,
    estimated_monthly_consumption_kwh: 108,
  },
  {
    id: 2,
    appliance_id: 2,
    appliance_name: "Ar Condicionado",
    appliance_category: "CLIMATE_CONTROL",
    quantity: 2,
    average_power_watts: 1400,
    average_daily_use_hours: 8,
    estimated_monthly_consumption_kwh: 672,
  },
];

/* ---------- mock analysis response (uso interno) ---------- */
export const MOCK_ANALYSIS_RESULT = {
  category: "BOM",
  probability: 0.78,
  recommendations: [
    "Troque lampadas incandescentes por LED para economizar ate 80%.",
    "Evite usar ar-condicionado com portas e janelas abertas.",
  ],
  estimated_monthly_cost: 180.5,
  status: "CONCLUIDA",
};

/* ---------- mock analyses history (F073: source/updated_at/highest_consumption_products) ---------- */
export const MOCK_ANALYSES = [
  {
    id: "a1",
    category: "MEDIANO",
    probability: 0.65,
    consumption_kwh: 320,
    estimated_monthly_cost: 240,
    peak_hour_usage: true,
    high_consumption_hours: 6,
    created_at: "2026-07-20T10:00:00Z",
    updated_at: "2026-07-21T11:30:00Z",
    source: "model",
    recommendations: [],
    status: "CONCLUIDA",
    highest_consumption_products: ["Ar Condicionado", "Geladeira"],
  },
  {
    id: "a2",
    category: "BOM",
    probability: 0.78,
    consumption_kwh: 280,
    estimated_monthly_cost: 210,
    peak_hour_usage: false,
    high_consumption_hours: 4,
    created_at: "2026-07-22T14:30:00Z",
    source: "rule-based (model unavailable)",
    recommendations: [],
    status: "CONCLUIDA",
    highest_consumption_products: ["Lampada LED"],
  },
  {
    id: "a3",
    category: "BOM",
    probability: 0.81,
    consumption_kwh: 260,
    estimated_monthly_cost: 195,
    peak_hour_usage: false,
    high_consumption_hours: 3,
    created_at: "2026-07-25T09:15:00Z",
    recommendations: [],
    status: "CONCLUIDA",
  },
];

export const MOCK_ANALYSES_WITH_PENDING = [
  ...MOCK_ANALYSES,
  {
    id: "a4",
    category: "EXCELENTE",
    probability: 0.72,
    consumption_kwh: 200,
    estimated_monthly_cost: 150,
    peak_hour_usage: false,
    high_consumption_hours: 2,
    created_at: "2026-07-26T08:00:00Z",
    recommendations: [],
    status: "PENDENTE",
  },
];

export const MOCK_ANALYSES_WITH_FAILURE = [
  ...MOCK_ANALYSES,
  {
    id: "a5",
    category: "EXCELENTE",
    probability: 0.7,
    consumption_kwh: 190,
    estimated_monthly_cost: 142.5,
    peak_hour_usage: false,
    high_consumption_hours: 2,
    created_at: "2026-07-26T09:00:00Z",
    recommendations: [],
    status: "FALHA",
  },
];

/* ---------- mock dashboard data ---------- */
export const MOCK_DASHBOARD = {
  total_analyses: 3,
  average_consumption_kwh: 286.67,
  total_estimated_cost: 645,
  total_co2_emission_kg: 27.52,
  monthly_consumption: [
    { month: "Jan", consumption_kwh: 300 },
    { month: "Fev", consumption_kwh: 280 },
    { month: "Mar", consumption_kwh: 320 },
    { month: "Abr", consumption_kwh: 260 },
    { month: "Mai", consumption_kwh: 290 },
    { month: "Jun", consumption_kwh: 270 },
  ],
};
