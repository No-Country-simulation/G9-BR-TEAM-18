export interface User {
  id: string;
  name: string;
  email: string;
  passwordResetRequired?: boolean;
}

export interface ApplianceType {
  /** ID numérico do backend convertido para string (ex.: "1", "2") */
  id: string;
  name: string;
  mlCategory: string;
  powerWatts: number;
  dailyUsageHours: number;
  icon: string;
}

export interface ApplianceItem {
  type: string;
  quantity: number;
}

type AnalysisStatus = "PENDENTE" | "CONCLUIDA" | "FALHA";

export interface AnalysisResponse {
  category: EfficiencyClassification;
  probability: number;
  recommendations: string[];
  estimated_monthly_cost: number;
  source?: string;
  highest_consumption_products?: string[];
}

export type EfficiencyClassification = "EXCELENTE" | "BOM" | "MEDIANO" | "RUIM" | "CRITICO";

export type AnalysisSourceKind = "ml" | "fallback";

/**
 * Normaliza o campo `source` da resposta da análise para o rótulo de exibição.
 *
 * O contrato real (docs/contrato-api.md) define os valores retornados pelo
 * ML Service: `model` (classificador treinado), `model+groq` (com fallback
 * LLM), `rule-based` (fallback por regras) — com sufixos descritivos como
 * `model (confidence 62.5%)` ou `rule-based (model error)`. Nenhum desses
 * valores é literalmente `"ML"`, então a comparação antiga (`source === "ML"`)
 * fazia TODA análise aparecer como "Fallback" no badge.
 *
 * Regras:
 * - `model*` (incl. `model+groq`, `model (confidence ...)`) → "ml"
 * - `rule-based*` → "fallback"
 * - legado dos mocks/tests (`"ML"` / `"FALLBACK"`) → compatibilidade
 * - demais valores ou ausência → undefined (badge não é exibido)
 */
export function resolveAnalysisSource(source?: string): AnalysisSourceKind | undefined {
  if (!source) return undefined;
  const s = source.trim().toLowerCase();
  if (s.startsWith("model")) return "ml";
  if (s.startsWith("rule-based")) return "fallback";
  if (s === "ml") return "ml";
  if (s === "fallback") return "fallback";
  return undefined;
}

export const CATEGORY_DISPLAY: Record<EfficiencyClassification, string> = {
  EXCELENTE: "Excelente",
  BOM: "Bom",
  MEDIANO: "Mediano",
  RUIM: "Ruim",
  CRITICO: "Crítico",
};

export const CATEGORY_COLORS: Record<EfficiencyClassification, string> = {
  EXCELENTE: "#059669",
  BOM: "#10b981",
  MEDIANO: "#f59e0b",
  RUIM: "#f97316",
  CRITICO: "#ef4444",
};

/**
 * Tipos de imóvel suportados. A fonte de verdade é o GET /contract-info
 * (F063 / ADR-0027); este union mantém type-safety em tempo de compilação
 * e serve de fallback local caso o endpoint dinâmico falhe.
 */
export type PropertyType = "RESIDENCIAL" | "APARTAMENTO" | "COMERCIAL";

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  RESIDENCIAL: "Casa",
  APARTAMENTO: "Apartamento",
  COMERCIAL: "Comercial",
};

/** Fallback local usado apenas se GET /contract-info falhar (F063). */
export const DEFAULT_PROPERTY_TYPES: PropertyType[] = ["RESIDENCIAL", "APARTAMENTO", "COMERCIAL"];

export interface ErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  fields: Record<string, string>;
}

export class ApiError extends Error {
  fields: Record<string, string>;

  constructor(message: string, fields: Record<string, string>) {
    super(message);
    this.name = "ApiError";
    this.fields = fields;
  }
}

export interface ApplianceSnapshot {
  name: string;
  category: string;
  quantity: number;
  average_power_watts: number;
  average_daily_use_hours: number;
  monthly_consumption_kwh: number;
}

export interface AnalysisHistory {
  id: string;
  propertyId: number;
  category: EfficiencyClassification;
  probability: number;
  consumption_kwh: number;
  estimated_monthly_cost: number;
  peak_hour_usage: boolean;
  high_consumption_hours: number;
  created_at: string;
  /** F073: data da última atualização da análise (backend AnalysisResponseDTO.updatedAt) */
  updated_at?: string;
  /** F073: fonte da classificação — valores do contrato: model, model+groq, rule-based */
  source?: string;
  recommendations: string[];
  status?: AnalysisStatus;
  appliances?: ApplianceSnapshot[];
  highest_consumption_products?: string[];
}

interface MonthlyConsumption {
  month: string;
  consumptionKwh: number;
}

export interface DashboardData {
  totalAnalyses: number;
  averageConsumptionKwh: number;
  totalEstimatedCost: number;
  totalCo2EmissionKg: number;
  monthlyConsumption: MonthlyConsumption[];
}

export type Regularity = "instantanea" | "diaria" | "semanal" | "mensal";

export const REGULARITY_OPTIONS: { value: Regularity; label: string }[] = [
  { value: "instantanea", label: "Instantânea" },
  { value: "diaria", label: "Diária" },
  { value: "semanal", label: "Semanal" },
  { value: "mensal", label: "Mensal" },
];

export interface PropertyAppliance {
  id: number;
  appliance_id: number;
  appliance_name: string;
  appliance_category: string;
  quantity: number;
  average_power_watts: number;
  average_daily_use_hours: number;
  estimated_monthly_consumption_kwh: number;
}
