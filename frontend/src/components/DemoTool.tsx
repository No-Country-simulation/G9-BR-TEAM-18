import { useState, useEffect, type FormEvent } from 'react'
import { BarChart3, Plus, Minus, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import type { AnaliseRequest, AnaliseResponse, ApparelhoType, ApparelhoItem, TipoImovel } from '../types'
import { ApiError, CATEGORIA_CORES, CATEGORIA_DISPLAY } from '../types'
import { analisarDemo, listarTiposAparelho } from '../services/demo'

const TIPOS_IMOVEL: TipoImovel[] = [
  'Casa', 'Apartamento', 'Comercial', 'Industria', 'Rural', 'Outro',
]

const CATEGORIAS: Record<string, { label: string; icone: string; cor: string }> = {
  Refrigeracao: { label: 'Refrigeração', icone: '🧊', cor: '#0ea5e9' },
  Climatizacao: { label: 'Climatização', icone: '❄️', cor: '#06b6d4' },
  Tecnologia: { label: 'Tecnologia', icone: '💻', cor: '#8b5cf6' },
  Iluminacao: { label: 'Iluminação', icone: '💡', cor: '#f59e0b' },
  Eletrodomesticos: { label: 'Eletrodomésticos', icone: '🏠', cor: '#ec4899' },
  Servicos: { label: 'Serviços', icone: '⚙️', cor: '#14b8a6' },
  Outros: { label: 'Outros', icone: '🔌', cor: '#6b7280' },
}

const ORDEM_CATEGORIAS = [
  'Refrigeracao', 'Climatizacao', 'Tecnologia',
  'Iluminacao', 'Eletrodomesticos', 'Servicos', 'Outros',
]

const NOME_CAMPOS: Record<string, string> = {
  consumo_kwh: 'Consumo mensal (kWh)',
  tipo_imovel: 'Tipo de imóvel',
  quantidade_equipamentos: 'Quantidade de equipamentos',
  horas_alto_consumo: 'Horas de alto consumo',
  uso_horario_pico: 'Uso em horário de pico',
}

export default function DemoTool() {
  const [tiposAparelho, setTiposAparelho] = useState<ApparelhoType[]>([])
  const [aparelhosSelecionados, setAparelhosSelecionados] = useState<ApparelhoItem[]>([])
  const [categoriasAbertas, setCategoriasAbertas] = useState<Set<string>>(new Set(['Refrigeracao', 'Climatizacao', 'Tecnologia']))

  const [form, setForm] = useState({
    tipo_imovel: 'Casa' as TipoImovel,
    horas_alto_consumo: 6,
    uso_horario_pico: false,
  })

  const [resultado, setResultado] = useState<AnaliseResponse | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [errosCampo, setErrosCampo] = useState<Record<string, string> | null>(null)
  const [loading, setLoading] = useState(false)

  // Carregar tipos de aparelho do backend
  useEffect(() => {
    listarTiposAparelho().then(setTiposAparelho).catch(() => {})
  }, [])

  // Calcular totais a partir dos aparelhos selecionados
  const resumo = aparelhosSelecionados.reduce((acc, item) => {
    const tipo = tiposAparelho.find(t => t.id === item.tipo)
    if (!tipo) return acc
    const dailyKwh = (tipo.potenciaWatts * tipo.horasUsoDia * item.quantidade) / 1000
    return {
      totalEquipamentos: acc.totalEquipamentos + item.quantidade,
      consumoMensalKwh: acc.consumoMensalKwh + dailyKwh * 30,
    }
  }, { totalEquipamentos: 0, consumoMensalKwh: 0 })

  function toggleCategoria(cat: string) {
    setCategoriasAbertas(prev => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  function adicionarAparelho(id: string) {
    setAparelhosSelecionados(prev => {
      const existente = prev.find(a => a.tipo === id)
      if (existente) {
        return prev.map(a =>
          a.tipo === id ? { ...a, quantidade: a.quantidade + 1 } : a
        )
      }
      return [...prev, { tipo: id, quantidade: 1 }]
    })
  }

  function alterarQuantidade(tipo: string, delta: number) {
    setAparelhosSelecionados(prev =>
      prev.map(a =>
        a.tipo === tipo
          ? { ...a, quantidade: Math.max(1, a.quantidade + delta) }
          : a
      ).filter(a => a.quantidade > 0)
    )
  }

  function removerAparelho(tipo: string) {
    setAparelhosSelecionados(prev => prev.filter(a => a.tipo !== tipo))
  }

  const aparelhosPorCategoria = (cat: string) =>
    tiposAparelho.filter(t => t.categoriaML === cat)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErro(null)
    setErrosCampo(null)
    setResultado(null)

    try {
      const request: AnaliseRequest = {
        tipo_imovel: form.tipo_imovel,
        horas_alto_consumo: form.horas_alto_consumo,
        uso_horario_pico: form.uso_horario_pico,
        aparelhos: aparelhosSelecionados.length > 0 ? aparelhosSelecionados : undefined,
        // Fallback: se não tiver aparelhos, usar valores padrão
        consumo_kwh: aparelhosSelecionados.length === 0 ? 300 : undefined,
        quantidade_equipamentos: aparelhosSelecionados.length === 0 ? 8 : undefined,
      }
      const res = await analisarDemo(request)
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
          <h2>Análise por Aparelhos</h2>
          <p>Adicione os aparelhos que você possui e veja uma análise personalizada do seu consumo.</p>
        </div>

        <div className="demo-grid">
          <form onSubmit={handleSubmit} className="demo-form">
            {/* === TIPO DE IMÓVEL === */}
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

            {/* === SEÇÃO: SEUS APARELHOS === */}
            <div className="appliance-section">
              <h3 className="appliance-section-title">
                Seus Aparelhos
                {aparelhosSelecionados.length > 0 && (
                  <span className="appliance-count-badge">
                    {aparelhosSelecionados.reduce((s, a) => s + a.quantidade, 0)} itens
                  </span>
                )}
              </h3>

              {/* Catálogo de aparelhos por categoria */}
              <div className="appliance-catalog">
                {ORDEM_CATEGORIAS.map(cat => {
                  const catInfo = CATEGORIAS[cat]
                  const aparelhos = aparelhosPorCategoria(cat)
                  if (aparelhos.length === 0) return null
                  const isOpen = categoriasAbertas.has(cat)
                  return (
                    <div key={cat} className="appliance-category">
                      <button
                        type="button"
                        className="appliance-category-header"
                        onClick={() => toggleCategoria(cat)}
                        style={{ '--cat-color': catInfo.cor } as React.CSSProperties}
                      >
                        <span className="category-icon">{catInfo.icone}</span>
                        <span className="category-label">{catInfo.label}</span>
                        <span className="category-count">{aparelhos.length}</span>
                        {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </button>

                      {isOpen && (
                        <div className="appliance-grid">
                          {aparelhos.map(t => {
                            const selected = aparelhosSelecionados.find(s => s.tipo === t.id)
                            return (
                              <button
                                key={t.id}
                                type="button"
                                className={`appliance-card ${selected ? 'selected' : ''}`}
                                onClick={() => !selected && adicionarAparelho(t.id)}
                                title={`${t.nome} - ${t.potenciaWatts}W, ~${t.horasUsoDia}h/dia`}
                              >
                                <span className="appliance-card-icon">{t.icone}</span>
                                <span className="appliance-card-name">{t.nome}</span>
                                <span className="appliance-card-watts">{t.potenciaWatts}W</span>
                                {selected && (
                                  <span className="appliance-card-qty">{selected.quantidade}x</span>
                                )}
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Lista de aparelhos selecionados */}
              {aparelhosSelecionados.length > 0 && (
                <div className="selected-appliances">
                  <h4>Aparelhos adicionados</h4>
                  <div className="selected-appliances-list">
                    {aparelhosSelecionados.map(item => {
                      const info = tiposAparelho.find(t => t.id === item.tipo)
                      if (!info) return null
                      return (
                        <div key={item.tipo} className="selected-appliance-item">
                          <span className="selected-icon">{info.icone}</span>
                          <span className="selected-name">{info.nome}</span>
                          <div className="selected-qty-controls">
                            <button
                              type="button"
                              className="qty-btn"
                              onClick={() => alterarQuantidade(item.tipo, -1)}
                              disabled={item.quantidade <= 1}
                            >
                              <Minus size={14} />
                            </button>
                            <span className="qty-value">{item.quantidade}</span>
                            <button
                              type="button"
                              className="qty-btn"
                              onClick={() => alterarQuantidade(item.tipo, 1)}
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                          <button
                            type="button"
                            className="remove-btn"
                            onClick={() => removerAparelho(item.tipo)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )
                    })}
                  </div>

                  {/* Resumo estimado */}
                  <div className="appliance-summary">
                    <div className="summary-stat">
                      <span className="summary-label">Equipamentos</span>
                      <span className="summary-value">{resumo.totalEquipamentos}</span>
                    </div>
                    <div className="summary-stat">
                      <span className="summary-label">Consumo estimado</span>
                      <span className="summary-value">{resumo.consumoMensalKwh.toFixed(0)} kWh/mês</span>
                    </div>
                  </div>
                </div>
              )}

              {aparelhosSelecionados.length === 0 && (
                <p className="appliance-empty-hint">
                  Clique nos aparelhos acima para adicioná-los à sua análise.
                </p>
              )}
            </div>

            {/* === COMPORTAMENTO === */}
            <div className="behavior-section">
              <h3 className="behavior-section-title">Hábitos de Consumo</h3>

              <div className="form-group">
                <label htmlFor="horas">Horas de alto consumo por dia</label>
                <input
                  id="horas"
                  type="number"
                  min="0"
                  max="24"
                  step="0.5"
                  value={form.horas_alto_consumo}
                  onChange={(e) => setForm({ ...form, horas_alto_consumo: +e.target.value })}
                />
              </div>

              <div className="form-group">
                <label htmlFor="pico" className="checkbox-label">
                  <input
                    id="pico"
                    type="checkbox"
                    checked={form.uso_horario_pico}
                    onChange={(e) => setForm({ ...form, uso_horario_pico: e.target.checked })}
                  />
                  Uso em horário de pico (18h às 21h)
                </label>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Analisando...' : 'Analisar Consumo'}
            </button>
          </form>

          {/* === RESULTADO === */}
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
                  {CATEGORIA_DISPLAY[resultado.categoria] ?? resultado.categoria}
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
                  {resultado.origem && (
                    <p className="result-origem">
                      Origem: {resultado.origem}
                    </p>
                  )}
                </div>
              </div>
            )}

            {!resultado && !erro && !loading && (
              <div className="result-placeholder">
                <BarChart3 size={48} className="placeholder-icon" />
                <p>Adicione seus aparelhos e clique em "Analisar Consumo" para ver o resultado aqui.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
