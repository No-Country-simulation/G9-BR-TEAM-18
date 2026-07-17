export interface User {
  id: string
  name: string
  email: string
}

/** Categorias de maior consumo (ML Service) — sem acentos para consistência com o modelo */
export const HIGHEST_CONSUMPTION_CATEGORIES = [
  'Refrigeracao', 'Climatizacao', 'Tecnologia',
  'Iluminacao', 'Eletrodomesticos', 'Servicos', 'Outros',
] as const

export type HighestConsumptionCategory = typeof HIGHEST_CONSUMPTION_CATEGORIES[number]

export interface AnalysisRequest {
  property_id?: string
  /** Consumo mensal em kWh (auto-calculado dos aparelhos, ou manual) */
  consumption_kwh?: number
  peak_hour_usage: boolean
  /** Total de equipamentos (auto-calculado dos aparelhos, ou manual) */
  equipment_quantity?: number
  property_type: PropertyType
  high_consumption_hours: number
  /** Categoria com maior consumo (auto-calculado dos aparelhos, ou manual) */
  highest_consumption_category?: string
  /** Distribuição de potência por categoria (4 campos do ML) */
  daily_consumption_distribution?: {
    REFRIGERATION_WATTS: number
    HEATING_WATTS: number
    AIR_CONDITIONING_WATTS: number
    LIGHTING_WATTS: number
  }
  /** Aparelhos específicos selecionados pelo usuário (precisão quantitativa) */
  appliances?: ApplianceItem[]
}

/** Tipo de aparelho disponível (vindo do backend ou fallback local) */
export interface ApplianceType {
  id: string
  name: string
  mlCategory: string
  distributionField: string
  powerWatts: number
  dailyUsageHours: number
  /** Nome do ícone Lucide (PascalCase) para exibição */
  icon: string
}

/** Aparelho selecionado pelo usuário com quantidade */
export interface ApplianceItem {
  type: string  // id do ApplianceType (ex: "GELADEIRA")
  quantity: number
}

export interface AnalysisResponse {
  category: EfficiencyClassification
  probability: number
  recommendations: string[]
  estimated_monthly_cost: number
  source?: string
}

export type EfficiencyClassification = 'EXCELENTE' | 'BOM' | 'MEDIANO' | 'RUIM' | 'CRITICO'

export const CATEGORY_DISPLAY: Record<EfficiencyClassification, string> = {
  EXCELENTE: 'Excelente',
  BOM: 'Bom',
  MEDIANO: 'Mediano',
  RUIM: 'Ruim',
  CRITICO: 'Crítico',
}

export const CATEGORY_COLORS: Record<EfficiencyClassification, string> = {
  EXCELENTE: '#059669',
  BOM: '#10b981',
  MEDIANO: '#f59e0b',
  RUIM: '#f97316',
  CRITICO: '#ef4444',
}

export type PropertyType =
  | 'Casa'
  | 'Apartamento'
  | 'Comercial'
  | 'Industria'
  | 'Rural'
  | 'Outro'

export interface ErrorResponse {
  timestamp: string
  status: number
  error: string
  message: string
  fields: Record<string, string>
}

export class ApiError extends Error {
  fields: Record<string, string>

  constructor(message: string, fields: Record<string, string>) {
    super(message)
    this.name = 'ApiError'
    this.fields = fields
  }
}

export interface AnalysisHistory {
  id: string
  category: EfficiencyClassification
  probability: number
  consumption_kwh: number
  estimated_monthly_cost: number
  peak_hour_usage: boolean
  high_consumption_hours: number
  created_at: string
  recommendations: string[]
}

export interface MonthlyConsumption {
  month: string
  consumptionKwh: number
}

export interface DashboardData {
  totalAnalyses: number
  averageConsumptionKwh: number
  totalEstimatedCost: number
  totalCo2EmissionKg: number
  monthlyConsumption: MonthlyConsumption[]
}
