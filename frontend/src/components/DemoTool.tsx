import { useState, type FormEvent } from 'react'
import { BarChart3 } from 'lucide-react'
import type { AnaliseRequest, AnaliseResponse, TipoImovel } from '../types'
import { ApiError } from '../types'
import { analisarDemo } from '../services/demo'

const TIPOS_IMOVEL: TipoImovel[] = [
  'Casa', 'Apartamento', 'Comercio', 'Industria', 'Rural', 'Outro',
]

const CATEGORIA_CORES: Record<string, string> = {
  Eficiente: '#10b981',
  Moderado: '#f59e0b',
  Ineficiente: '#ef4444',
}

const NOME_CAMPOS: Record<string, string> = {
  consumo_kwh: 'Consumo mensal (kWh)',
  tipo_imovel: 'Tipo de imóvel',
  quantidade_equipamentos: 'Quantidade de equipamentos',
  horas_alto_consumo: 'Horas de alto consumo',
  uso_horario_pico: 'Uso em horário de pico',
}

export default function DemoTool() {
  const [form, setForm] = useState<AnaliseRequest>({
    consumo_kwh: 300,
    uso_horario_pico: false,
    quantidade_equipamentos: 8,
    tipo_imovel: 'Casa',
    horas_alto_consumo: 6,
  })
  const [resultado, setResultado] = useState<AnaliseResponse | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [errosCampo, setErrosCampo] = useState<Record<string, string> | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErro(null)
    setErrosCampo(null)
    setResultado(null)
    try {
      const res = await analisarDemo(form)
      setResultado(res)
    } catch (err) {
      if (err instanceof ApiError) {
        setErro(err.message)
        setErrosCampo(err.campos)
      } else {
        setErro(err instanceof Error ? err.message : 'Erro desconhecido')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <section id="demo" className="demo-section">
      <div className="demo-container">
        <div className="demo-header">
          <h2>Demonstração Rápida</h2>
          <p>Preencha os campos e veja uma análise instantânea do seu perfil de consumo.</p>
        </div>

        <div className="demo-grid">
          <form onSubmit={handleSubmit} className="demo-form">
            <div className="form-group">
              <label htmlFor="consumo">Consumo mensal (kWh)</label>
              <input
                id="consumo"
                type="number"
                min="0"
                step="0.01"
                value={form.consumo_kwh}
                onChange={(e) => setForm({ ...form, consumo_kwh: +e.target.value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="tipo">Tipo de imóvel</label>
              <select
                id="tipo"
                value={form.tipo_imovel}
                onChange={(e) => setForm({ ...form, tipo_imovel: e.target.value as TipoImovel })}
              >
                {TIPOS_IMOVEL.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="equip">Quantidade de equipamentos</label>
              <input
                id="equip"
                type="number"
                min="1"
                max="100"
                value={form.quantidade_equipamentos}
                onChange={(e) => setForm({ ...form, quantidade_equipamentos: +e.target.value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="pico">
                <input
                  id="pico"
                  type="checkbox"
                  checked={form.uso_horario_pico}
                  onChange={(e) => setForm({ ...form, uso_horario_pico: e.target.checked })}
                />
                Uso em horário de pico
              </label>
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Analisando...' : 'Analisar Consumo'}
            </button>
          </form>

          <div className="demo-result">
            {loading && (
              <div className="result-placeholder">
                <div className="spinner" />
                <p>Processando sua análise...</p>
              </div>
            )}

            {erro && !loading && (
              <div className="result-error">
                <p className="error-title">{erro}</p>
                {errosCampo && Object.keys(errosCampo).length > 0 && (
                  <ul className="error-fields">
                    {Object.entries(errosCampo).map(([campo, msg]) => (
                      <li key={campo}>
                        <strong>{NOME_CAMPOS[campo] ?? campo}:</strong> {msg}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {resultado && !loading && (
              <div className="result-card">
                <div
                  className="result-badge"
                  style={{
                    backgroundColor: CATEGORIA_CORES[resultado.categoria] ?? '#6b7280',
                  }}
                >
                  {resultado.categoria}
                </div>

                <div className="result-stats">
                  <div className="stat">
                    <span className="stat-label">Confiança</span>
                    <span className="stat-value">
                      {(resultado.probabilidade * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Custo Estimado</span>
                    <span className="stat-value">
                      R$ {resultado.custo_estimado_mensal.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="result-recs">
                  <h4>Recomendações</h4>
                  <ul>
                    {resultado.recomendacoes.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {!resultado && !erro && !loading && (
              <div className="result-placeholder">
                <BarChart3 size={48} className="placeholder-icon" />
                <p>Preencha o formulário e clique em "Analisar Consumo" para ver o resultado aqui.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
