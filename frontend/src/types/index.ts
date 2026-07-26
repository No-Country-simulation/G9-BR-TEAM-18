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
  distributionField: string;
  powerWatts: number;
  dailyUsageHours: number;
  icon: string;
}

export interface ApplianceItem {
  type: string;
  quantity: number;
}

export type AnalysisStatus = "PENDENTE" | "CONCLUIDA" | "FALHA";

export interface AnalysisResponse {
  category: EfficiencyClassification;
  probability: number;
  recommendations: string[];
  estimated_monthly_cost: number;
  source?: string;
  status?: AnalysisStatus;
}

export type EfficiencyClassification = "EXCELENTE" | "BOM" | "MEDIANO" | "RUIM" | "CRITICO";

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

export const PROPERTY_TYPES = ["RESIDENCIAL", "COMERCIAL"] as const;

export type PropertyType = (typeof PROPERTY_TYPES)[number];

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

export interface AnalysisHistory {
  id: string;
  category: EfficiencyClassification;
  probability: number;
  consumption_kwh: number;
  estimated_monthly_cost: number;
  peak_hour_usage: boolean;
  high_consumption_hours: number;
  created_at: string;
  recommendations: string[];
  status?: AnalysisStatus;
}

export interface MonthlyConsumption {
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
