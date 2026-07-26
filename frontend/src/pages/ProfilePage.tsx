import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import * as I from "lucide-react";
import type {
  ApplianceType,
  ApplianceItem,
  PropertyType,
  Regularity,
  AnalysisResponse,
} from "../types";
import {
  ApiError,
  CATEGORY_COLORS,
  CATEGORY_DISPLAY,
  PROPERTY_TYPES,
  REGULARITY_OPTIONS,
} from "../types";
import {
  listProperties,
  createProperty,
  updateProperty,
  listAppliances,
  listPropertyAppliances,
  batchUpdateAppliances,
  analyzeEnergy,
  listAnalyses,
} from "../services/api";
import type { PropertyResponse } from "../services/api";

const CATEGORIES: Record<string, { label: string; icon: string; color: string }> = {
  Refrigeracao: { label: "Refrigeração", icon: "Snowflake", color: "#0ea5e9" },
  Climatizacao: { label: "Climatização", icon: "Wind", color: "#06b6d4" },
  Tecnologia: { label: "Tecnologia", icon: "Monitor", color: "#8b5cf6" },
  Iluminacao: { label: "Iluminação", icon: "Lightbulb", color: "#f59e0b" },
  Eletrodomesticos: { label: "Eletrodomésticos", icon: "Home", color: "#ec4899" },
  Servicos: { label: "Serviços", icon: "Wrench", color: "#14b8a6" },
};

const CATEGORY_ORDER = [
  "Refrigeracao",
  "Climatizacao",
  "Tecnologia",
  "Iluminacao",
  "Eletrodomesticos",
  "Servicos",
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
  const [propertyType, setPropertyType] = useState<PropertyType>("RESIDENCIAL");
  const [address, setAddress] = useState("");
  const [residentCount, setResidentCount] = useState(1);
  const [areaSqm, setAreaSqm] = useState(50);
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
        setApplianceTypes(appls);
        const active = props.find((p) => p.active) ?? props[0] ?? null;
        if (active) {
          setProperty(active);
          setPropertyType(active.property_type as PropertyType);
          setAddress(active.address ?? "");
          setResidentCount(active.resident_count ?? 1);
          setAreaSqm(active.area_sqm ?? 50);
          return listPropertyAppliances(active.id).then((pa) => {
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
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Erro ao carregar dados");
      })
      .finally(() => setLoading(false));
  }, [user, navigate, setRegularity]);

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
      const existing = prev.find((a) => a.type === id);
      if (existing) {
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
      return {
        totalEquipment: 0,
        monthlyConsumptionKwh: 0,
        highestConsumptionCategory: undefined,
      };
    }
    const aggregated: Record<string, number> = {};
    let totalConsumption = 0;
    let totalQty = 0;
    for (const item of selectedAppliances) {
      const appliance = applianceTypes.find((t) => t.id === item.type);
      if (!appliance) continue;
      const dailyKwh = (appliance.powerWatts * appliance.dailyUsageHours * item.quantity) / 1000;
      totalConsumption += dailyKwh * 30;
      totalQty += item.quantity;
      const totalW = appliance.powerWatts * item.quantity;
      const cat = appliance.mlCategory;
      aggregated[cat] = (aggregated[cat] ?? 0) + totalW;
    }
    let highestCat = "Outros";
    let maxValue = -1;
    for (const [cat, val] of Object.entries(aggregated)) {
      if (val > maxValue) {
        maxValue = val;
        highestCat = cat;
      }
    }
    return {
      totalEquipment: totalQty,
      monthlyConsumptionKwh: totalConsumption,
      highestConsumptionCategory: highestCat,
    };
  }, [selectedAppliances, applianceTypes]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      let prop = property;
      if (prop) {
        prop = await updateProperty(
          prop.id,
          "Meu Perfil",
          propertyType,
          true,
          address,
          residentCount,
          areaSqm,
        );
      } else {
        prop = await createProperty("Meu Perfil", propertyType, address, residentCount, areaSqm);
      }
      setProperty(prop);

      const batchItems = selectedAppliances
        .map((item) => {
          const appliance = applianceTypes.find((t) => t.id === item.type);
          return appliance
            ? { appliance_id: Number(appliance.id), quantity: item.quantity }
            : null;
        })
        .filter((x): x is { appliance_id: number; quantity: number } => x !== null);

      if (batchItems.length > 0) {
        await batchUpdateAppliances(prop.id, batchItems);
      }

      localStorage.setItem(REGULARITY_KEY, regularity);
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
      const consumptionKwh =
        selectedAppliances.length > 0 ? applianceCalc.monthlyConsumptionKwh : 300;
      const res = await analyzeEnergy(
        property.id,
        consumptionKwh,
        propertyType === "COMERCIAL",
        Math.max(4, Math.round(consumptionKwh / 100)),
        applianceCalc.highestConsumptionCategory,
      );
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
                    {t === "RESIDENCIAL" ? "Residencial" : "Comercial"}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="endereco">Endereço</label>
              <input
                id="endereco"
                type="text"
                className="form-input"
                placeholder="Rua, número, bairro"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="moradores">Moradores</label>
                <input
                  id="moradores"
                  type="number"
                  min="1"
                  max="50"
                  value={residentCount}
                  onChange={(e) => setResidentCount(Math.max(1, Number(e.target.value)))}
                />
              </div>
              <div className="form-group">
                <label htmlFor="area">Área (m²)</label>
                <input
                  id="area"
                  type="number"
                  min="10"
                  max="99999"
                  value={areaSqm}
                  onChange={(e) => setAreaSqm(Math.max(10, Number(e.target.value)))}
                />
              </div>
            </div>

            <h3 className="section-title">
              Seus Aparelhos
              {selectedAppliances.length > 0 && (
                <span className="appliance-count-badge">{applianceCalc.totalEquipment} equip.</span>
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
                <button
                  type="button"
                  className="search-clear"
                  onClick={() => setSearchTerm("")}
                  aria-label="Limpar busca"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="appliance-catalog">
              {CATEGORY_ORDER.map((cat) => {
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
                      aria-label={
                        isOpen ? `Recolher ${catInfo.label}` : `Expandir ${catInfo.label}`
                      }
                      style={{ "--cat-color": catInfo.color } as React.CSSProperties}
                    >
                      <span className="category-icon">
                        <LucideIcon name={catInfo.icon} size={18} />
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
                              aria-label={
                                selected
                                  ? `${t.name} - ${selected.quantity}x selecionado`
                                  : `Adicionar ${t.name} - ${t.powerWatts}W`
                              }
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
                            aria-label={`Reduzir quantidade de ${info.name}`}
                          >
                            <I.Minus size={14} />
                          </button>
                          <span className="qty-value">{item.quantity}</span>
                          <button
                            type="button"
                            className="qty-btn"
                            onClick={() => changeQuantity(item.type, 1)}
                            aria-label={`Aumentar quantidade de ${info.name}`}
                          >
                            <I.Plus size={14} />
                          </button>
                        </div>
                        <button
                          type="button"
                          className="remove-btn"
                          onClick={() => removeAppliance(item.type)}
                          aria-label={`Remover ${info.name} da lista`}
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
                    <span className="summary-value">{applianceCalc.totalEquipment}</span>
                  </div>
                  <div className="summary-stat">
                    <span className="summary-label">Consumo estimado</span>
                    <span className="summary-value">
                      {applianceCalc.monthlyConsumptionKwh.toFixed(0)} kWh/mês
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
                  aria-label={`Regularidade: ${opt.label}`}
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
              aria-label="Salvar perfil do imóvel"
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
                aria-label="Executar análise energética"
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
