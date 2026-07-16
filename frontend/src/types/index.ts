export interface Usuario {
  id: string
  nome: string
  email: string
}

export interface AnaliseRequest {
  imovel_id?: string
  consumo_kwh: number
  uso_horario_pico: boolean
  quantidade_equipamentos: number
  tipo_imovel: TipoImovel
  horas_alto_consumo: number
}

export interface AnaliseResponse {
  categoria: ClassificacaoEficienciaApi
  probabilidade: number
  recomendacoes: string[]
  custo_estimado_mensal: number
}

export type ClassificacaoEficienciaApi = 'EFICIENTE' | 'MODERADO' | 'ALTO'

export const CATEGORIA_DISPLAY: Record<ClassificacaoEficienciaApi, string> = {
  EFICIENTE: 'Eficiente',
  MODERADO: 'Moderado',
  ALTO: 'Ineficiente',
}

export const CATEGORIA_CORES: Record<ClassificacaoEficienciaApi, string> = {
  EFICIENTE: '#10b981',
  MODERADO: '#f59e0b',
  ALTO: '#ef4444',
}

export type TipoImovel =
  | 'Casa'
  | 'Apartamento'
  | 'Comercio'
  | 'Industria'
  | 'Rural'
  | 'Outro'

export interface ErroResponse {
  timestamp: string
  status: number
  erro: string
  mensagem: string
  campos: Record<string, string>
}

export class ApiError extends Error {
  campos: Record<string, string>

  constructor(mensagem: string, campos: Record<string, string>) {
    super(mensagem)
    this.name = 'ApiError'
    this.campos = campos
  }
}

export interface AnaliseHistorico {
  id: string
  categoria: ClassificacaoEficienciaApi
  probabilidade: number
  consumo_kwh: number
  custo_estimado_mensal: number
  uso_horario_pico: boolean
  horas_alto_consumo: number
  created_at: string
  recomendacoes: string[]
}

export interface ConsumoMensal {
  mes: string
  consumoKwh: number
}

export interface DashboardData {
  totalAnalises: number
  mediaConsumoKwh: number
  totalCustoEstimado: number
  totalEmissaoCo2Kg: number
  consumoPorMes: ConsumoMensal[]
}
