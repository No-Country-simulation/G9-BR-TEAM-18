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
  categoria_maior_consumo?: string
  distribuicao_consumo_diario?: {
    REFRIGERACAO_WATTS: number
    AQUECIMENTO_WATTS: number
    CLIMATIZACAO_WATTS: number
    ILUMINACAO_WATTS: number
  }
}

export interface AnaliseResponse {
  categoria: ClassificacaoEficienciaApi
  probabilidade: number
  recomendacoes: string[]
  custo_estimado_mensal: number
  origem?: string
}

export type ClassificacaoEficienciaApi = 'EXCELENTE' | 'BOM' | 'MEDIANO' | 'RUIM' | 'CRITICO'

export const CATEGORIA_DISPLAY: Record<ClassificacaoEficienciaApi, string> = {
  EXCELENTE: 'Excelente',
  BOM: 'Bom',
  MEDIANO: 'Mediano',
  RUIM: 'Ruim',
  CRITICO: 'Crítico',
}

export const CATEGORIA_CORES: Record<ClassificacaoEficienciaApi, string> = {
  EXCELENTE: '#059669',
  BOM: '#10b981',
  MEDIANO: '#f59e0b',
  RUIM: '#f97316',
  CRITICO: '#ef4444',
}

export type TipoImovel =
  | 'Casa'
  | 'Apartamento'
  | 'Comercial'
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
