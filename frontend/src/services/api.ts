import type { AnaliseHistorico, AnaliseRequest, AnaliseResponse, DashboardData } from '../types'

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

export async function analisarEnergia(
  data: AnaliseRequest
): Promise<AnaliseResponse> {
  const response = await authFetch('/analise-energetica', {
    method: 'POST',
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.mensagem ?? 'Erro ao analisar consumo')
  }

  return response.json()
}

export async function login(email: string, senha: string): Promise<void> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, senha }),
  })

  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.mensagem ?? 'Erro ao fazer login')
  }
}

export async function cadastrar(nome: string, email: string, senha: string): Promise<void> {
  const response = await fetch(`${API_URL}/auth/cadastrar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ nome, email, senha }),
  })

  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.mensagem ?? 'Erro ao cadastrar')
  }
}

export async function listarAnalises(): Promise<AnaliseHistorico[]> {
  const response = await authFetch('/analises')
  if (!response.ok) return []
  return response.json()
}

export async function buscarDashboard(): Promise<DashboardData> {
  const response = await authFetch('/dashboard')
  if (!response.ok) {
    return { totalAnalises: 0, mediaConsumoKwh: 0, totalCustoEstimado: 0, totalEmissaoCo2Kg: 0, consumoPorMes: [] }
  }
  return response.json()
}
