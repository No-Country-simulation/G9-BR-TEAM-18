import { describe, it, expect, vi, beforeEach } from 'vitest'
import { analyzeDemo } from '../services/demo'

const mockFetch = vi.fn()
globalThis.fetch = mockFetch

const API_URL = 'http://localhost:8080'

const requestBody = {
  consumption_kwh: 200,
  peak_hour_usage: false,
  equipment_quantity: 8,
  property_type: 'Casa' as const,
  high_consumption_hours: 4,
}

describe('analyzeDemo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns AnalysisResponse on success', async () => {
    const responseData = {
      category: 'BOM',
      probability: 0.85,
      recommendations: ['Mantenha o bom acompanhamento'],
      estimated_monthly_cost: 150,
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(responseData),
    })

    const result = await analyzeDemo(requestBody)

    expect(mockFetch).toHaveBeenCalledWith(`${API_URL}/energy-analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    })

    expect(result).toEqual(responseData)
  })

  it('throws ApiError on 400 error', async () => {
    const errorBody = {
      message: 'Erro de validação',
      fields: { consumption_kwh: 'deve ser positivo' },
    }

    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve(errorBody),
    })

    await expect(analyzeDemo(requestBody)).rejects.toThrow('Erro de validação')
  })

  it('uses default message when server does not return message', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ fields: {} }),
    })

    await expect(analyzeDemo(requestBody)).rejects.toThrow('Erro ao analisar consumo')
  })

  it('uses dynamically obtained API_URL', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ category: 'EFICIENTE' }),
    })

    await analyzeDemo({ ...requestBody, consumption_kwh: 100 })

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/energy-analysis'),
      expect.objectContaining({ method: 'POST' })
    )
  })
})
