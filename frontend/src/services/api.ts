import type { AnalysisHistory, AnalysisRequest, AnalysisResponse, DashboardData } from '../types'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`))
  return match ? decodeURIComponent(match[2]) : null
}

async function authFetch(path: string, options?: RequestInit): Promise<Response> {
  const xsrfToken = getCookie('XSRF-TOKEN')
  const headers: Record<string, string> = { ...(options?.headers as Record<string, string> ?? {}) }
  if (xsrfToken) {
    headers['X-XSRF-TOKEN'] = xsrfToken
  }
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...headers },
    credentials: 'include',
  })
  return response
}

export async function analyzeEnergy(
  data: AnalysisRequest
): Promise<AnalysisResponse> {
  const response = await authFetch('/energy-analysis', {
    method: 'POST',
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.message ?? 'Erro ao analisar consumo')
  }

  return response.json()
}

export async function login(email: string, password: string): Promise<void> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  })

  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.message ?? 'Erro ao fazer login')
  }
}

export async function register(name: string, email: string, password: string): Promise<void> {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ name, email, password }),
  })

  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.message ?? 'Erro ao cadastrar')
  }
}

export async function listAnalyses(): Promise<AnalysisHistory[]> {
  const response = await authFetch('/analyses')
  if (!response.ok) return []
  return response.json()
}

export async function fetchDashboard(): Promise<DashboardData> {
  const response = await authFetch('/dashboard')
  if (!response.ok) {
    return { totalAnalyses: 0, averageConsumptionKwh: 0, totalEstimatedCost: 0, totalCo2EmissionKg: 0, monthlyConsumption: [] }
  }
  return response.json()
}
