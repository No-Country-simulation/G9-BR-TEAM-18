import { describe, it, expect, vi, beforeEach } from 'vitest'
import { analisarDemo } from '../services/demo'

const mockFetch = vi.fn()
globalThis.fetch = mockFetch

const API_URL = 'http://localhost:8080'

const requestBody = {
  consumo_kwh: 200,
  uso_horario_pico: false,
  quantidade_equipamentos: 8,
  tipo_imovel: 'Casa' as const,
  horas_alto_consumo: 4,
}

describe('analisarDemo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retorna AnaliseResponse em caso de sucesso', async () => {
    const responseData = {
      categoria: 'MODERADO',
      probabilidade: 0.75,
      recomendacoes: ['Mantenha o bom acompanhamento'],
      custo_estimado_mensal: 150,
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(responseData),
    })

    const result = await analisarDemo(requestBody)

    expect(mockFetch).toHaveBeenCalledWith(`${API_URL}/analise-energetica`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    })

    expect(result).toEqual(responseData)
  })

  it('lança ApiError em caso de erro 400', async () => {
    const errorBody = {
      mensagem: 'Erro de validação',
      campos: { consumo_kwh: 'deve ser positivo' },
    }

    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve(errorBody),
    })

    await expect(analisarDemo(requestBody)).rejects.toThrow('Erro de validação')
  })

  it('usa mensagem padrão quando o servidor não retorna mensagem', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ campos: {} }),
    })

    await expect(analisarDemo(requestBody)).rejects.toThrow('Erro ao analisar consumo')
  })

  it('usa API_URL obtida dinamicamente', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ categoria: 'EFICIENTE' }),
    })

    await analisarDemo({ ...requestBody, consumo_kwh: 100 })

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/analise-energetica'),
      expect.objectContaining({ method: 'POST' })
    )
  })
})
