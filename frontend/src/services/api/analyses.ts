import type { AnalysisHistory, AnalysisResponse, DashboardData, ErrorResponse } from "../../types";
import { ApiError } from "../../types";
import { authFetch, redirectToLogin } from "./client";

export async function analyzeEnergy(
  propertyId: number,
  consumptionKwh: number,
  peakHourUsage: boolean,
  highConsumptionHours: number,
  highestConsumptionCategory?: string,
): Promise<AnalysisResponse> {
  const body: Record<string, unknown> = {
    property_id: propertyId,
    consumption_kwh: consumptionKwh,
    peak_hour_usage: peakHourUsage,
    high_consumption_hours: highConsumptionHours,
  };
  if (highestConsumptionCategory) {
    body.highest_consumption_category = highestConsumptionCategory;
  }
  const response = await authFetch("/energy-analysis", {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err: ErrorResponse = await response.json();
    throw new ApiError(err.message ?? "Erro ao analisar consumo", err.fields ?? {});
  }

  return response.json();
}

export async function listAnalyses(): Promise<AnalysisHistory[]> {
  const response = await authFetch("/analyses");
  if (!response.ok) {
    if (response.status === 401) redirectToLogin();
    return [];
  }
  const raw: Array<Record<string, unknown>> = await response.json();
  return raw.map((a) => ({
    id: String(a.id),
    propertyId: (a.property_id as number) ?? 0,
    category: a.category as AnalysisHistory["category"],
    probability: Number(a.probability ?? 0),
    consumption_kwh: Number(a.consumption_kwh ?? 0),
    estimated_monthly_cost: Number(a.estimated_monthly_cost ?? 0),
    peak_hour_usage: a.peak_hour_usage === true || a.peak_hour_usage === "true",
    high_consumption_hours: Number(a.high_consumption_hours ?? 0),
    created_at: String(a.created_at ?? ""),
    updated_at: a.updated_at ? String(a.updated_at) : undefined,
    source: a.source as string | undefined,
    recommendations: (a.recommendations as string[]) ?? [],
    status: a.status as AnalysisHistory["status"],
    appliances: (a.appliances as AnalysisHistory["appliances"]) ?? [],
    highest_consumption_products: (a.highest_consumption_products as string[]) ?? undefined,
  }));
}

export async function fetchDashboard(): Promise<DashboardData> {
  const response = await authFetch("/dashboard");
  if (!response.ok) {
    if (response.status === 401) redirectToLogin();
    return {
      totalAnalyses: 0,
      averageConsumptionKwh: 0,
      totalEstimatedCost: 0,
      totalCo2EmissionKg: 0,
      monthlyConsumption: [],
    };
  }
  const raw = await response.json();
  return {
    totalAnalyses: raw.total_analyses ?? 0,
    averageConsumptionKwh: raw.average_consumption_kwh ?? 0,
    totalEstimatedCost: raw.total_estimated_cost ?? 0,
    totalCo2EmissionKg: raw.total_co2_emission_kg ?? 0,
    monthlyConsumption: (raw.monthly_consumption ?? []).map(
      (m: { month: string; consumption_kwh: number }) => ({
        month: m.month,
        consumptionKwh: m.consumption_kwh,
      }),
    ),
  };
}

export async function fetchAnalysisById(analysisId: string): Promise<AnalysisHistory> {
  const response = await authFetch(`/analyses/${analysisId}`);
  if (!response.ok) {
    if (response.status === 401) redirectToLogin();
    const err = await response.json();
    throw new Error(err.message ?? "Erro ao carregar análise");
  }
  const raw = await response.json();
  return {
    id: String(raw.id),
    propertyId: (raw.property_id as number) ?? 0,
    category: raw.category,
    probability: raw.probability ?? 0,
    consumption_kwh: raw.consumption_kwh ?? 0,
    estimated_monthly_cost: raw.estimated_monthly_cost ?? 0,
    peak_hour_usage: raw.peak_hour_usage === true || raw.peak_hour_usage === "true",
    high_consumption_hours: raw.high_consumption_hours ?? 0,
    created_at: raw.created_at,
    updated_at: raw.updated_at ? String(raw.updated_at) : undefined,
    source: raw.source as string | undefined,
    recommendations: raw.recommendations ?? [],
    status: raw.status,
    appliances: (raw.appliances ?? []).map(
      (s: {
        name: string;
        category: string;
        quantity: number;
        average_power_watts: number;
        average_daily_use_hours: number;
        monthly_consumption_kwh: number;
      }) => ({
        name: s.name,
        category: s.category,
        quantity: s.quantity,
        average_power_watts: s.average_power_watts,
        average_daily_use_hours: s.average_daily_use_hours,
        monthly_consumption_kwh: s.monthly_consumption_kwh,
      }),
    ),
    highest_consumption_products: (raw.highest_consumption_products as string[]) ?? undefined,
  };
}

export async function simulateEnergy(
  propertyId: number,
  consumptionKwh: number,
  peakHourUsage: boolean,
  highConsumptionHours: number,
  highestConsumptionCategory?: string,
): Promise<AnalysisResponse> {
  const body: Record<string, unknown> = {
    property_id: propertyId,
    consumption_kwh: consumptionKwh,
    peak_hour_usage: peakHourUsage,
    high_consumption_hours: highConsumptionHours,
  };
  if (highestConsumptionCategory) {
    body.highest_consumption_category = highestConsumptionCategory;
  }
  const response = await authFetch("/energy-analysis/simulate", {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err: ErrorResponse = await response.json();
    throw new ApiError(err.message ?? "Erro ao simular consumo", err.fields ?? {});
  }

  const raw = await response.json();
  return {
    ...raw,
    probability: Number(raw.probability ?? 0),
    estimated_monthly_cost: Number(raw.estimated_monthly_cost ?? 0),
  };
}

export async function fetchCategories(): Promise<string[]> {
  const response = await authFetch("/energy-analysis/categories");
  if (!response.ok) {
    if (response.status === 401) redirectToLogin();
    return [];
  }
  return response.json();
}

export async function deleteAnalysis(analysisId: string): Promise<void> {
  const response = await authFetch(`/analyses/${analysisId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    if (response.status === 401) redirectToLogin();
    const err = await response.json();
    throw new Error(err.message ?? "Erro ao excluir análise");
  }
}
