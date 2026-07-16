import type { AnaliseRequest, AnaliseResponse, ErroResponse } from '../types'
import { ApiError } from '../types'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

export async function analisarDemo(
  data: AnaliseRequest
): Promise<AnaliseResponse> {
  const response = await fetch(`${API_URL}/analise-energetica`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const err: ErroResponse = await response.json()
    throw new ApiError(
      err.mensagem ?? 'Erro ao analisar consumo',
      err.campos ?? {}
    )
  }

  return response.json()
}
