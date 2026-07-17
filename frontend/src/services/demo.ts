import type { AnalysisRequest, AnalysisResponse, ApplianceType, ErrorResponse } from '../types'
import { ApiError } from '../types'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

export async function analyzeDemo(
  data: AnalysisRequest
): Promise<AnalysisResponse> {
  const response = await fetch(`${API_URL}/energy-analysis`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const err: ErrorResponse = await response.json()
    throw new ApiError(
      err.message ?? 'Erro ao analisar consumo',
      err.fields ?? {}
    )
  }

  return response.json()
}

/** Busca a lista de tipos de aparelho disponíveis */
export async function listApplianceTypes(): Promise<ApplianceType[]> {
  try {
    const response = await fetch(`${API_URL}/appliances/types`)
    if (!response.ok) return []
    return response.json()
  } catch {
    return []
  }
}
