import type {
  AnalysisHistory,
  AnalysisResponse,
  DashboardData,
  ApplianceType,
  ErrorResponse,
  PropertyAppliance,
} from "../types";
import { ApiError } from "../types";
import { enrichAppliance } from "../data/appliances";
import type { ApplianceCatalogItem } from "../data/appliances";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

function redirectToLogin(): void {
  document.cookie = "SESSION_TOKEN=; Path=/; Max-Age=0";
  window.location.href = "/login";
}

async function authFetch(path: string, options?: RequestInit): Promise<Response> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...((options?.headers as Record<string, string>) ?? {}),
    },
    credentials: "include",
  });
  return response;
}

export async function login(email: string, password: string): Promise<void> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message ?? "Erro ao fazer login");
  }
}

export async function register(name: string, email: string, password: string): Promise<void> {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ name, email, password }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message ?? "Erro ao cadastrar");
  }
}

export interface PropertyResponse {
  id: number;
  alias: string;
  property_type: string;
  active: boolean;
  address?: string;
  resident_count?: number;
  area_sqm?: number;
}

export async function createProperty(
  alias: string,
  propertyType: string,
  address?: string,
  residentCount?: number,
  areaSqm?: number,
): Promise<PropertyResponse> {
  const response = await authFetch("/properties", {
    method: "POST",
    body: JSON.stringify({
      alias,
      property_type: propertyType,
      address: address || null,
      resident_count: residentCount || null,
      area_sqm: areaSqm || null,
    }),
  });

  if (!response.ok) {
    const err: ErrorResponse = await response.json();
    throw new ApiError(err.message ?? "Erro ao criar propriedade", err.fields ?? {});
  }

  return response.json();
}

export async function listProperties(): Promise<PropertyResponse[]> {
  const response = await authFetch("/properties");
  if (!response.ok) {
    if (response.status === 401) redirectToLogin();
    return [];
  }
  return response.json();
}

export async function updateProperty(
  propertyId: number,
  alias: string,
  propertyType: string,
  active: boolean,
  address?: string,
  residentCount?: number,
  areaSqm?: number,
): Promise<PropertyResponse> {
  const response = await authFetch(`/properties/${propertyId}`, {
    method: "PUT",
    body: JSON.stringify({
      alias,
      property_type: propertyType,
      active,
      address: address || null,
      resident_count: residentCount || null,
      area_sqm: areaSqm || null,
    }),
  });
  if (!response.ok) {
    const err: ErrorResponse = await response.json();
    throw new ApiError(err.message ?? "Erro ao atualizar propriedade", err.fields ?? {});
  }
  return response.json();
}

export async function listPropertyAppliances(propertyId: number): Promise<PropertyAppliance[]> {
  const response = await authFetch(`/properties/${propertyId}/appliances`);
  if (!response.ok) {
    if (response.status === 401) redirectToLogin();
    return [];
  }
  return response.json();
}

export async function batchUpdateAppliances(
  propertyId: number,
  items: Array<{ appliance_id: number; quantity: number }>,
): Promise<PropertyAppliance[]> {
  const response = await authFetch(`/properties/${propertyId}/appliances/batch`, {
    method: "PUT",
    body: JSON.stringify(items),
  });
  if (!response.ok) {
    const err: ErrorResponse = await response.json();
    throw new ApiError(err.message ?? "Erro ao atualizar aparelhos", err.fields ?? {});
  }
  return response.json();
}

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

export async function fetchPreferences(): Promise<{
  consumption_goal?: number;
  regularity?: string;
  // F069 / ADR-0046: campos expostos pelo backend após B051
  peak_hour_usage?: boolean;
  high_consumption_hours?: number;
}> {
  const response = await authFetch("/auth/me");
  if (!response.ok) {
    if (response.status === 401) redirectToLogin();
    return {};
  }
  return response.json();
}

export async function updatePreferences(preferences: {
  consumption_goal?: number | null;
  regularity?: string | null;
  // F069 / ADR-0046: persistidos nas preferências do usuário (backend B051)
  peak_hour_usage?: boolean | null;
  high_consumption_hours?: number | null;
}): Promise<void> {
  const response = await authFetch("/auth/preferences", {
    method: "PUT",
    body: JSON.stringify(preferences),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message ?? "Erro ao salvar preferências");
  }
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

export interface ContractInfo {
  propertyTypes: string[];
  consumptionCategories: string[];
  efficiencyCategories: string[];
}

/**
 * Consome GET /contract-info (B050 / ADR-0027) para descobrir dinamicamente
 * os tipos de imóvel e categorias válidas expostos pelo ML Service.
 *
 * Nunca lança: em caso de falha/erro retorna listas vazias para que a página
 * use seu fallback local (F063).
 */
export async function fetchContractInfo(): Promise<ContractInfo> {
  try {
    const response = await authFetch("/contract-info");
    if (!response.ok) {
      if (response.status === 401) redirectToLogin();
      return { propertyTypes: [], consumptionCategories: [], efficiencyCategories: [] };
    }
    const raw = (await response.json()) as {
      property_types?: unknown;
      consumption_categories?: unknown;
      efficiency_categories?: unknown;
    };
    return {
      propertyTypes: Array.isArray(raw?.property_types) ? (raw.property_types as string[]) : [],
      consumptionCategories: Array.isArray(raw?.consumption_categories)
        ? (raw.consumption_categories as string[])
        : [],
      efficiencyCategories: Array.isArray(raw?.efficiency_categories)
        ? (raw.efficiency_categories as string[])
        : [],
    };
  } catch {
    return { propertyTypes: [], consumptionCategories: [], efficiencyCategories: [] };
  }
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

export async function listAppliances(): Promise<ApplianceType[]> {
  const response = await authFetch("/appliances");
  if (!response.ok) {
    if (response.status === 401) redirectToLogin();
    const err: ErrorResponse = await response.json();
    throw new Error(err.message ?? "Erro ao carregar catálogo de aparelhos");
  }
  const raw: ApplianceCatalogItem[] = await response.json();
  return raw.map(enrichAppliance);
}
