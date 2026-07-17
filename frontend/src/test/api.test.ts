import { describe, it, expect, vi, beforeEach } from 'vitest'
import { analyzeEnergy, login, register, listAnalyses, fetchDashboard } from '../services/api'

const API_URL = 'http://localhost:8080'
const mockFetch = vi.fn()
globalThis.fetch = mockFetch

function mockResponse(ok: boolean, data: unknown) {
  return { ok, json: () => Promise.resolve(data), headers: new Headers() } as Response
}

describe('analyzeEnergy', () => {
  beforeEach(() => vi.clearAllMocks())

  it('sends authenticated POST and returns response', async () => {
    const data = { category: 'BOM', probability: 0.85, recommendations: [], estimated_monthly_cost: 75 }
    mockFetch.mockResolvedValueOnce(mockResponse(true, data))

    const result = await analyzeEnergy({
      consumption_kwh: 100, peak_hour_usage: false, equipment_quantity: 3, property_type: 'Casa', high_consumption_hours: 2,
    })

    expect(result).toEqual(data)
  })
})

describe('login', () => {
  beforeEach(() => vi.clearAllMocks())

  it('sends POST to /auth/login', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(true, { id: '1', name: 'Teste', email: 'test@test.com' }))

    await login('test@test.com', '123456')

    expect(mockFetch).toHaveBeenCalledWith(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email: 'test@test.com', password: '123456' }),
    })
  })

  it('throws error when login fails', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(false, { message: 'Credenciais inválidas' }))

    await expect(login('x@x.com', 'wrong')).rejects.toThrow('Credenciais inválidas')
  })

  it('uses default message when server does not return message', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(false, {}))

    await expect(login('x@x.com', 'wrong')).rejects.toThrow('Erro ao fazer login')
  })
})

describe('register', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws error when registration fails', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(false, { message: 'Email já existe' }))

    await expect(register('A', 'a@a.com', '123')).rejects.toThrow('Email já existe')
  })
})

describe('listAnalyses', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns empty array when response is not ok', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(false, []))

    const result = await listAnalyses()
    expect(result).toEqual([])
  })
})

describe('fetchDashboard', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns zeroed data when response is not ok', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(false, {}))

    const result = await fetchDashboard()
    expect(result).toEqual({
      totalAnalyses: 0,
      averageConsumptionKwh: 0,
      totalEstimatedCost: 0,
      totalCo2EmissionKg: 0,
      monthlyConsumption: [],
    })
  })
})
