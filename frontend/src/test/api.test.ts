import { describe, it, expect, vi, beforeEach } from 'vitest'
import { analisarEnergia, login, cadastrar, listarAnalises, buscarDashboard } from '../services/api'

const API_URL = 'http://localhost:8080'
const mockFetch = vi.fn()
globalThis.fetch = mockFetch

function mockResponse(ok: boolean, data: unknown) {
  return { ok, json: () => Promise.resolve(data), headers: new Headers() } as Response
}

describe('analisarEnergia', () => {
  beforeEach(() => vi.clearAllMocks())

  it('envia POST autenticado e retorna resposta', async () => {
    const data = { categoria: 'BOM', probabilidade: 0.85, recomendacoes: [], custo_estimado_mensal: 75 }
    mockFetch.mockResolvedValueOnce(mockResponse(true, data))

    const result = await analisarEnergia({
      consumo_kwh: 100, uso_horario_pico: false, quantidade_equipamentos: 3, tipo_imovel: 'Casa', horas_alto_consumo: 2,
    })

    expect(result).toEqual(data)
  })
})

describe('login', () => {
  beforeEach(() => vi.clearAllMocks())

  it('envia POST para /auth/login', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(true, { id: '1', nome: 'Teste', email: 'test@test.com' }))

    await login('test@test.com', '123456')

    expect(mockFetch).toHaveBeenCalledWith(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email: 'test@test.com', senha: '123456' }),
    })
  })

  it('lança erro quando login falha', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(false, { mensagem: 'Credenciais inválidas' }))

    await expect(login('x@x.com', 'wrong')).rejects.toThrow('Credenciais inválidas')
  })

  it('usa mensagem padrão quando servidor não retorna mensagem', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(false, {}))

    await expect(login('x@x.com', 'wrong')).rejects.toThrow('Erro ao fazer login')
  })
})

describe('cadastrar', () => {
  beforeEach(() => vi.clearAllMocks())

  it('lança erro quando cadastro falha', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(false, { mensagem: 'Email já existe' }))

    await expect(cadastrar('A', 'a@a.com', '123')).rejects.toThrow('Email já existe')
  })
})

describe('listarAnalises', () => {
  beforeEach(() => vi.clearAllMocks())

  it('retorna lista vazia quando resposta não é ok', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(false, []))

    const result = await listarAnalises()
    expect(result).toEqual([])
  })
})

describe('buscarDashboard', () => {
  beforeEach(() => vi.clearAllMocks())

  it('retorna dados zerados quando resposta não é ok', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(false, {}))

    const result = await buscarDashboard()
    expect(result).toEqual({
      totalAnalises: 0,
      mediaConsumoKwh: 0,
      totalCustoEstimado: 0,
      totalEmissaoCo2Kg: 0,
      consumoPorMes: [],
    })
  })
})
