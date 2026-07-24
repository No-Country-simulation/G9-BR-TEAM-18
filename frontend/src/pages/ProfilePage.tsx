import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import * as I from "lucide-react";
import type {
  ApplianceType,
  ApplianceItem,
  PropertyType,
  PropertyAppliance,
  Regularity,
  AnalysisResponse,
} from "../types";
import { ApiError, CATEGORY_COLORS, CATEGORY_DISPLAY, REGULARITY_OPTIONS } from "../types";
import {
  listProperties,
  createProperty,
  updateProperty,
  listAppliances,
  listPropertyAppliances,
  addApplianceToProperty,
  removeApplianceFromProperty,
  analyzeEnergy,
  listAnalyses,
} from "../services/api";
import type { PropertyResponse } from "../services/api";

const PROPERTY_TYPES: PropertyType[] = [
  "Casa",
  "Apartamento",
  "Comercial",
  "Industria",
  "Rural",
  "Outro",
];

const CATEGORIES: Record<string, { label: string; icone: string; cor: string }> = {
  Refrigeracao: { label: "Refrigeração", icone: "Snowflake", cor: "#0ea5e9" },
  Climatizacao: { label: "Climatização", icone: "Wind", cor: "#06b6d4" },
  Tecnologia: { label: "Tecnologia", icone: "Monitor", cor: "#8b5cf6" },
  Iluminacao: { label: "Iluminação", icone: "Lightbulb", cor: "#f59e0b" },
  Eletrodomesticos: { label: "Eletrodomésticos", icone: "Home", cor: "#ec4899" },
  Servicos: { label: "Serviços", icone: "Wrench", cor: "#14b8a6" },
  Outros: { label: "Outros", icone: "Box", cor: "#6b7280" },
};

const ORDEM_CATEGORIAS = [
  "Refrigeracao",
  "Climatizacao",
  "Tecnologia",
  "Iluminacao",
  "Eletrodomesticos",
  "Servicos",
  "Outros",
];

const REGULARITY_KEY = "energiai_regularity";

function LucideIcon({
  name,
  size = 16,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const IconComponent = (
    I as unknown as Record<string, React.ComponentType<{ size?: number; className?: string }>>
  )[name];
  return IconComponent ? <IconComponent size={size} className={className} /> : null;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [property, setProperty] = useState<PropertyResponse | null>(null);
  const [propertyType, setPropertyType] = useState<PropertyType>("Casa");
  const [savedAppliances, setSavedAppliances] = useState<PropertyAppliance[]>([]);
  const [selectedAppliances, setSelectedAppliances] = useState<ApplianceItem[]>([]);
  const [applianceTypes, setApplianceTypes] = useState<ApplianceType[]>([]);
  const [regularity, setRegularity] = useState<Regularity>("instantanea");
  const [openCategories, setOpenCategories] = useState<Set<string>>(
    new Set(["Refrigeracao", "Climatizacao", "Tecnologia"]),
  );
  const [searchTerm, setSearchTerm] = useState("");

  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [lastAnalysis, setLastAnalysis] = useState<{
    category: string;
    probability: number;
    cost: number;
    date: string;
  } | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    const saved = localStorage.getItem(REGULARITY_KEY);
    if (saved) setRegularity(saved as Regularity);

    Promise.all([listAppliances(), listProperties()])
      .then(([appls, props]) => {
        setApplianceTypes(appls.length > 0 ? appls : []);
        const active = props.find((p) => p.active) ?? props[0] ?? null;
        if (active) {
          setProperty(active);
          setPropertyType(active.property_type as PropertyType);
          return listPropertyAppliances(active.id).then((pa) => {
            setSavedAppliances(pa);
            setSelectedAppliances(
              pa.map((a) => ({ type: String(a.appliance_id), quantity: a.quantity })),
            );
          });
        }
      })
      .then(() => {
        return listAnalyses().then((all) => {
          if (all.length > 0) {
            const latest = all[all.length - 1];
            setLastAnalysis({
              category: latest.category,
              probability: latest.probability,
              cost: latest.estimated_monthly_cost,
              date: latest.created_at,
            });
          }
        });
      })
      .finally(() => setLoading(false));
  }, [user, navigate]);

  const filteredTypes = useMemo(() => {
    if (!searchTerm.trim()) return applianceTypes;
    const term = searchTerm
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    return applianceTypes.filter(
      (t) =>
        t.name
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .includes(term) || t.mlCategory.toLowerCase().includes(term),
    );
  }, [applianceTypes, searchTerm]);

  function toggleCategory(cat: string) {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  function addAppliance(id: string) {
    setSelectedAppliances((prev) => {
      const existente = prev.find((a) => a.type === id);
      if (existente) {
        return prev.map((a) => (a.type === id ? { ...a, quantity: a.quantity + 1 } : a));
      }
      return [...prev, { type: id, quantity: 1 }];
    });
  }

  function changeQuantity(typeId: string, delta: number) {
    setSelectedAppliances((prev) =>
      prev
        .map((a) => (a.type === typeId ? { ...a, quantity: Math.max(1, a.quantity + delta) } : a))
        .filter((a) => a.quantity > 0),
    );
  }

  function removeAppliance(typeId: string) {
    setSelectedAppliances((prev) => prev.filter((a) => a.type !== typeId));
  }

  const applianceCalc = useMemo(() => {
    if (selectedAppliances.length === 0) {
      return { totalEquipamentos: 0, consumoMensalKwh: 0 };
    }
    let totalConsumo = 0;
    let totalQty = 0;
    for (const item of selectedAppliances) {
      const tipo = applianceTypes.find((t) => t.id === item.type);
      if (!tipo) continue;
      const dailyKwh = (tipo.powerWatts * tipo.dailyUsageHours * item.quantity) / 1000;
      totalConsumo += dailyKwh * 30;
      totalQty += item.quantity;
    }
    return { totalEquipamentos: totalQty, consumoMensalKwh: totalConsumo };
  }, [selectedAppliances, applianceTypes]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      let prop = property;
      if (prop) {
        prop = await updateProperty(prop.id, "Meu Perfil", propertyType, true);
      } else {
        prop = await createProperty("Meu Perfil", propertyType);
      }
      setProperty(prop);

      const selectedWithBackend = selectedAppliances
        .map((item) => ({
          item,
          tipo: applianceTypes.find((t) => t.id === item.type),
        }))
        .filter((x): x is { item: typeof x.item; tipo: ApplianceType } => !!x.tipo?.backendId);

      const selectedBackendIds = new Set(selectedWithBackend.map((x) => x.tipo.backendId!));

      for (const { item, tipo } of selectedWithBackend) {
        const aid = tipo.backendId!;
        const saved = savedAppliances.find((sa) => sa.appliance_id === aid);
        if (!saved || saved.quantity !== item.quantity) {
          await addApplianceToProperty(prop.id, aid, item.quantity);
        }
      }
      for (const sa of savedAppliances) {
        if (!selectedBackendIds.has(sa.appliance_id)) {
          await removeApplianceFromProperty(prop.id, sa.appliance_id);
        }
      }

      localStorage.setItem(REGULARITY_KEY, regularity);

      const refreshed = await listPropertyAppliances(prop.id);
      setSavedAppliances(refreshed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar perfil");
    } finally {
      setSaving(false);
    }
  }

  async function handleAnalyzeNow() {
    if (!property) return;
    setAnalyzing(true);
    setError(null);
    setResult(null);
    try {
      const consumptionKwh = selectedAppliances.length > 0 ? applianceCalc.consumoMensalKwh : 300;
      const res = await analyzeEnergy(property.id, consumptionKwh, false, 6);
      setResult(res);
      setLastAnalysis({
        category: res.category,
        probability: res.probability,
        cost: res.estimated_monthly_cost,
        date: new Date().toISOString(),
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro na análise");
    } finally {
      setAnalyzing(false);
    }
  }

  const appliancesByCategory = (cat: string) => filteredTypes.filter((t) => t.mlCategory === cat);

  if (loading) {
    return (
      <div className="dash-page" style={{ display: "flex", justifyContent: "center" }}>
        <p>Carregando perfil...</p>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <I.UserCog size={28} />
          <h1>Meu Perfil</h1>
          <p>Configure seu tipo de residência e os aparelhos que você possui.</p>
        </div>

        {error && (
          <div className="profile-error">
            <I.AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="profile-grid">
          <div className="profile-form">
            <h3 className="section-title">Dados do Imóvel</h3>

            <div className="form-group">
              <label>Tipo de imóvel</label>
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value as PropertyType)}
              >
                {PROPERTY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <h3 className="section-title">
              Seus Aparelhos
              {selectedAppliances.length > 0 && (
                <span className="appliance-count-badge">
                  {applianceCalc.totalEquipamentos} equip.
                </span>
              )}
            </h3>
            <p className="section-subtitle">
              Adicione os aparelhos que você possui. Eles serão salvos no seu perfil.
            </p>

            <div className="appliance-search">
              <I.Search size={16} className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Buscar aparelho..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button type="button" className="search-clear" onClick={() => setSearchTerm("")}>
                  ✕
                </button>
              )}
            </div>

            <div className="appliance-catalog">
              {ORDEM_CATEGORIAS.map((cat) => {
                const catInfo = CATEGORIES[cat];
                const appliances = appliancesByCategory(cat);
                if (appliances.length === 0) return null;
                const isOpen = openCategories.has(cat);
                return (
                  <div key={cat} className="appliance-category">
                    <button
                      type="button"
                      className="appliance-category-header"
                      onClick={() => toggleCategory(cat)}
                      style={{ "--cat-color": catInfo.cor } as React.CSSProperties}
                    >
                      <span className="category-icon">
                        <LucideIcon name={catInfo.icone} size={18} />
                      </span>
                      <span className="category-label">{catInfo.label}</span>
                      <span className="category-count">{appliances.length}</span>
                      {isOpen ? <I.ChevronDown size={16} /> : <I.ChevronRight size={16} />}
                    </button>
                    {isOpen && (
                      <div className="appliance-grid">
                        {appliances.map((t) => {
                          const selected = selectedAppliances.find((s) => s.type === t.id);
                          return (
                            <button
                              key={t.id}
                              type="button"
                              className={`appliance-card ${selected ? "selected" : ""}`}
                              onClick={() => !selected && addAppliance(t.id)}
                              title={`${t.name} - ${t.powerWatts}W, ~${t.dailyUsageHours}h/dia`}
                            >
                              <LucideIcon name={t.icon} size={22} className="appliance-card-icon" />
                              <span className="appliance-card-name">{t.name}</span>
                              <span className="appliance-card-watts">{t.powerWatts}W</span>
                              {selected && (
                                <span className="appliance-card-qty">{selected.quantity}x</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {selectedAppliances.length > 0 ? (
              <div className="selected-appliances">
                <h4>Aparelhos adicionados</h4>
                <div className="selected-appliances-list">
                  {selectedAppliances.map((item) => {
                    const info = applianceTypes.find((t) => t.id === item.type);
                    if (!info) return null;
                    return (
                      <div key={item.type} className="selected-appliance-item">
                        <LucideIcon name={info.icon} size={16} className="selected-icon" />
                        <span className="selected-name">{info.name}</span>
                        <div className="selected-qty-controls">
                          <button
                            type="button"
                            className="qty-btn"
                            onClick={() => changeQuantity(item.type, -1)}
                            disabled={item.quantity <= 1}
                          >
                            <I.Minus size={14} />
                          </button>
                          <span className="qty-value">{item.quantity}</span>
                          <button
                            type="button"
                            className="qty-btn"
                            onClick={() => changeQuantity(item.type, 1)}
                          >
                            <I.Plus size={14} />
                          </button>
                        </div>
                        <button
                          type="button"
                          className="remove-btn"
                          onClick={() => removeAppliance(item.type)}
                        >
                          <I.Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
                <div className="appliance-summary">
                  <div className="summary-stat">
                    <span className="summary-label">Equipamentos</span>
                    <span className="summary-value">{applianceCalc.totalEquipamentos}</span>
                  </div>
                  <div className="summary-stat">
                    <span className="summary-label">Consumo estimado</span>
                    <span className="summary-value">
                      {applianceCalc.consumoMensalKwh.toFixed(0)} kWh/mês
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="appliance-empty-hint">
                Clique nos aparelhos acima para adicioná-los ao seu perfil.
              </p>
            )}

            <h3 className="section-title">Regularidade da Análise</h3>
            <p className="section-subtitle">
              Com que frequência você quer que a análise seja executada automaticamente?
            </p>
            <div className="regularity-selector">
              {REGULARITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`regularity-option ${regularity === opt.value ? "active" : ""}`}
                  onClick={() => setRegularity(opt.value)}
                >
                  {opt.value === "instantanea" && <I.Zap size={16} />}
                  {opt.value === "diaria" && <I.Sun size={16} />}
                  {opt.value === "semanal" && <I.Calendar size={16} />}
                  {opt.value === "mensal" && <I.CalendarDays size={16} />}
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>

            <button
              type="button"
              className="btn btn-primary btn-full"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                "Salvando..."
              ) : (
                <>
                  <I.Save size={18} /> Salvar Perfil
                </>
              )}
            </button>

            {property && (
              <button
                type="button"
                className="btn btn-secondary btn-full"
                onClick={handleAnalyzeNow}
                disabled={analyzing || saving}
                style={{ marginTop: "0.75rem" }}
              >
                {analyzing ? (
                  "Analisando..."
                ) : (
                  <>
                    <I.BarChart3 size={18} /> Analisar Agora
                  </>
                )}
              </button>
            )}
          </div>

          <div className="profile-result">
            {analyzing && (
              <div className="result-placeholder">
                <div className="spinner" />
                <p>Analisando seu consumo...</p>
              </div>
            )}

            {result && !analyzing && (
              <div className="result-card">
                <div
                  className="result-badge"
                  style={{ backgroundColor: CATEGORY_COLORS[result.category] ?? "#6b7280" }}
                >
                  {CATEGORY_DISPLAY[result.category] ?? result.category}
                </div>
                <div className="result-stats">
                  <div className="stat">
                    <span className="stat-label">Confiança</span>
                    <span className="stat-value">{(result.probability * 100).toFixed(0)}%</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Custo Estimado</span>
                    <span className="stat-value">
                      R$ {result.estimated_monthly_cost.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="result-recs">
                  <h4>Recomendações</h4>
                  <ul>
                    {result.recommendations.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {!result && !analyzing && lastAnalysis && (
              <div className="profile-last-analysis">
                <h3>
                  <I.Clock size={18} /> Última Análise
                </h3>
                <div
                  className="profile-last-badge"
                  style={{
                    backgroundColor:
                      CATEGORY_COLORS[lastAnalysis.category as keyof typeof CATEGORY_COLORS] ??
                      "#6b7280",
                  }}
                >
                  {CATEGORY_DISPLAY[lastAnalysis.category as keyof typeof CATEGORY_DISPLAY] ??
                    lastAnalysis.category}
                </div>
                <div className="profile-last-stats">
                  <span>Confiança: {(lastAnalysis.probability * 100).toFixed(0)}%</span>
                  <span>Custo: R$ {lastAnalysis.cost.toFixed(2)}</span>
                </div>
                <p className="profile-last-date">
                  {new Date(lastAnalysis.date).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <button
                  type="button"
                  className="dash-btn dash-btn--primary"
                  onClick={() => navigate("/history")}
                  style={{ marginTop: "0.75rem" }}
                >
                  Ver histórico completo
                </button>
              </div>
            )}

            {!result && !analyzing && !lastAnalysis && (
              <div className="result-placeholder">
                <I.UserCog size={48} className="placeholder-icon" />
                <p>Configure seu perfil e clique em "Analisar Agora" para ver o resultado.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
