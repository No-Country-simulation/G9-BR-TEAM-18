import type {
  AnalysisHistory,
  AnalysisRequest,
  AnalysisResponse,
  DashboardData,
  ApplianceType,
  ErrorResponse,
} from "../types";
import { ApiError } from "../types";

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

export async function analyzeEnergy(data: AnalysisRequest): Promise<AnalysisResponse> {
  const response = await authFetch("/energy-analysis", {
    method: "POST",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const err: ErrorResponse = await response.json();
    throw new ApiError(err.message ?? "Erro ao analisar consumo", err.fields ?? {});
  }

  return response.json();
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
  return response.json();
}

export async function listApplianceTypes(): Promise<ApplianceType[]> {
  try {
    const response = await authFetch("/appliances/types");
    if (!response.ok) return [];
    return response.json();
  } catch {
    return [];
  }
}
