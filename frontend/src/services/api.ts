import type {
  AnalysisHistory,
  AnalysisResponse,
  DashboardData,
  ApplianceType,
  ErrorResponse,
  PropertyAppliance,
} from "../types";
import { ApiError } from "../types";
import { APPLIANCE_FALLBACK, mergeAppliancesWithBackend } from "../data/appliances";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

function redirectToLogin(): void {
  localStorage.removeItem("energiai_user");
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

// --- Auth ---

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

// --- Properties ---

export interface PropertyResponse {
  id: number;
  alias: string;
  property_type: string;
  active: boolean;
}

export async function createProperty(
  alias: string,
  propertyType: string,
): Promise<PropertyResponse> {
  const response = await authFetch("/properties", {
    method: "POST",
    body: JSON.stringify({ alias, property_type: propertyType }),
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

export async function addApplianceToProperty(
  propertyId: number,
  applianceId: number,
  quantity: number,
): Promise<void> {
  const response = await authFetch(`/properties/${propertyId}/appliances`, {
    method: "POST",
    body: JSON.stringify({ appliance_id: applianceId, quantity }),
  });

  if (!response.ok) {
    const err: ErrorResponse = await response.json();
    throw new ApiError(err.message ?? "Erro ao adicionar aparelho", err.fields ?? {});
  }
}

export async function updateProperty(
  propertyId: number,
  alias: string,
  propertyType: string,
  active: boolean,
): Promise<PropertyResponse> {
  const response = await authFetch(`/properties/${propertyId}`, {
    method: "PUT",
    body: JSON.stringify({ alias, property_type: propertyType, active }),
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

export async function updateApplianceQuantity(
  propertyId: number,
  applianceId: number,
  quantity: number,
): Promise<void> {
  const response = await authFetch(`/properties/${propertyId}/appliances/${applianceId}`, {
    method: "PUT",
    body: JSON.stringify({ appliance_id: applianceId, quantity }),
  });
  if (!response.ok) {
    const err: ErrorResponse = await response.json();
    throw new ApiError(err.message ?? "Erro ao atualizar aparelho", err.fields ?? {});
  }
}

export async function removeApplianceFromProperty(
  propertyId: number,
  applianceId: number,
): Promise<void> {
  const response = await authFetch(`/properties/${propertyId}/appliances/${applianceId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const err: ErrorResponse = await response.json();
    throw new ApiError(err.message ?? "Erro ao remover aparelho", err.fields ?? {});
  }
}

/**
 * Atualiza todos os aparelhos de uma propriedade em uma única chamada.
 * Remove aparelhos não listados, adiciona/atualiza os informados.
 */
export async function batchUpdateAppliances(
  propertyId: number,
  items: Array<{ applianceId: number; quantity: number }>,
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

// --- Analysis ---

export async function analyzeEnergy(
  propertyId: number,
  consumptionKwh: number,
  peakHourUsage: boolean,
  highConsumptionHours: number,
): Promise<AnalysisResponse> {
  const response = await authFetch("/energy-analysis", {
    method: "POST",
    body: JSON.stringify({
      property_id: propertyId,
      consumption_kwh: consumptionKwh,
      peak_hour_usage: peakHourUsage,
      high_consumption_hours: highConsumptionHours,
    }),
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
  return response.json();
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

// --- Appliances ---

export async function listAppliances(): Promise<ApplianceType[]> {
  try {
    const response = await authFetch("/appliances");
    if (!response.ok) return APPLIANCE_FALLBACK;
    const raw: Array<{
      id: number;
      name: string;
      appliance_category: string;
      average_power_watts: number;
      average_daily_use_hours: number;
    }> = await response.json();
    return mergeAppliancesWithBackend(APPLIANCE_FALLBACK, raw);
  } catch {
    return APPLIANCE_FALLBACK;
  }
}
