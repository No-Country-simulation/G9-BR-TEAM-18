import { useState, useEffect, useMemo, type FormEvent, type ReactElement } from "react";
import * as I from "lucide-react";
import type { AnalysisResponse, ApplianceType, ApplianceItem, PropertyType } from "../types";
import { ApiError, CATEGORY_COLORS, CATEGORY_DISPLAY, PROPERTY_TYPES } from "../types";
import {
  analyzeEnergy,
  listAppliances,
  createProperty,
  addApplianceToProperty,
} from "../services/api";
import { APPLIANCE_FALLBACK } from "../data/appliances";

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

function LucideIcon({
  name,
  size = 16,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}): ReactElement | null {
  const IconComponent = (
    I as unknown as Record<string, React.ComponentType<{ size?: number; className?: string }>>
  )[name];
  return IconComponent ? <IconComponent size={size} className={className} /> : null;
}

const FIELD_NAMES: Record<string, string> = {
  consumption_kwh: "Consumo mensal (kWh)",
  property_type: "Tipo de imóvel",
  equipment_quantity: "Quantidade de equipamentos",
  high_consumption_hours: "Horas de alto consumo",
  peak_hour_usage: "Uso em horário de pico",
};

export default function AnalysisForm() {
  const [applianceTypes, setApplianceTypes] = useState<ApplianceType[]>([]);
  const [selectedAppliances, setSelectedAppliances] = useState<ApplianceItem[]>([]);
  const [openCategories, setOpenCategories] = useState<Set<string>>(
    new Set(["Refrigeracao", "Climatizacao", "Tecnologia"]),
  );

  const [form, setForm] = useState({
    property_type: "RESIDENCIAL" as PropertyType,
    consumption_kwh: 300,
    high_consumption_hours: 6,
    peak_hour_usage: false,
  });

  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");

  const [usingFallback, setUsingFallback] = useState(true);
  useEffect(() => {
    listAppliances()
      .then((data) => {
        setApplianceTypes(data.length > 0 ? data : APPLIANCE_FALLBACK);
        setUsingFallback(data.length === 0 || !data[0]?.backendId);
      })
      .catch(() => {
        setApplianceTypes(APPLIANCE_FALLBACK);
        setUsingFallback(true);
      });
  }, []);

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

  const applianceCalc = useMemo(() => {
    if (selectedAppliances.length === 0) {
      return {
        totalEquipment: 0,
        monthlyConsumptionKwh: 0,
        highestConsumptionCategory: undefined,
        refrigerationWatts: 0,
        heatingWatts: 0,
        airConditioningWatts: 0,
        lightingWatts: 0,
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
      if (appliance.distributionField !== "NONE") {
        const distKey = `dist_${appliance.distributionField}`;
        aggregated[distKey] = (aggregated[distKey] ?? 0) + totalW;
      }
    }

    let highestCat = "Outros";
    let maxValue = -1;
    for (const [cat, val] of Object.entries(aggregated)) {
      if (cat.startsWith("dist_")) continue;
      if (val > maxValue) {
        maxValue = val;
        highestCat = cat;
      }
    }

    return {
      totalEquipment: totalQty,
      monthlyConsumptionKwh: totalConsumption,
      highestConsumptionCategory: highestCat,
      refrigerationWatts: aggregated["dist_REFRIGERATION_WATTS"] ?? 0,
      heatingWatts: aggregated["dist_HEATING_WATTS"] ?? 0,
      airConditioningWatts: aggregated["dist_AIR_CONDITIONING_WATTS"] ?? 0,
      lightingWatts: aggregated["dist_LIGHTING_WATTS"] ?? 0,
    };
  }, [selectedAppliances, applianceTypes]);

  useEffect(() => {
    if (selectedAppliances.length === 0) return;
    setForm((prev) => ({
      ...prev,
      consumption_kwh: Math.round(applianceCalc.monthlyConsumptionKwh),
    }));
  }, [selectedAppliances, applianceCalc]);

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

  function changeQuantity(type2: string, delta: number) {
    setSelectedAppliances((prev) =>
      prev
        .map((a) => (a.type === type2 ? { ...a, quantity: Math.max(1, a.quantity + delta) } : a))
        .filter((a) => a.quantity > 0),
    );
  }

  function removeAppliance(type2: string) {
    setSelectedAppliances((prev) => prev.filter((a) => a.type !== type2));
  }

  const appliancesByCategory = (cat: string) => filteredTypes.filter((t) => t.mlCategory === cat);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFieldErrors(null);
    setResult(null);

    try {
      const prop = await createProperty("Minha Residencia", form.property_type);
      const propId = prop.id;

      if (!usingFallback && selectedAppliances.length > 0) {
        for (const item of selectedAppliances) {
          const appliance = applianceTypes.find((t) => t.id === item.type);
          if (appliance?.backendId) {
            await addApplianceToProperty(propId, appliance.backendId, item.quantity);
          }
        }
      }

      const consumptionKwh =
        selectedAppliances.length > 0 ? applianceCalc.monthlyConsumptionKwh : form.consumption_kwh;

      const res = await analyzeEnergy(
        propId,
        consumptionKwh,
        form.peak_hour_usage,
        form.high_consumption_hours,
        applianceCalc.highestConsumptionCategory,
      );
      setResult(res);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        setFieldErrors(err.fields);
      } else {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="demo" className="demo-section">
      <div className="demo-container">
        <div className="demo-header">
          <h2>Análise Energética</h2>
          <p>
            Informe os dados do seu imóvel e adicione os aparelhos que você possui para uma análise
            precisa.
          </p>
        </div>

        <div className="demo-grid">
          <form onSubmit={handleSubmit} className="demo-form">
            <h3 className="section-title">Dados do Imóvel</h3>

            <div className="form-group">
              <label htmlFor="tipo">Tipo de imóvel</label>
              <select
                id="tipo"
                value={form.property_type}
                onChange={(e) =>
                  setForm({ ...form, property_type: e.target.value as PropertyType })
                }
              >
                {PROPERTY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="consumo">
                Consumo mensal (kWh)
                {selectedAppliances.length > 0 && <span className="auto-badge">auto</span>}
              </label>
              <input
                id="consumo"
                type="number"
                min="0"
                step="0.1"
                value={form.consumption_kwh}
                onChange={(e) => setForm({ ...form, consumption_kwh: +e.target.value })}
              />
              {selectedAppliances.length > 0 && (
                <small className="field-hint">
                  Calculado automaticamente dos aparelhos. Edite se souber o valor exato da conta.
                </small>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="horas">Horas de alto consumo por dia</label>
              <input
                id="horas"
                type="number"
                min="0"
                max="24"
                step="0.5"
                value={form.high_consumption_hours}
                onChange={(e) => setForm({ ...form, high_consumption_hours: +e.target.value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="pico" className="checkbox-label">
                <input
                  id="pico"
                  type="checkbox"
                  checked={form.peak_hour_usage}
                  onChange={(e) => setForm({ ...form, peak_hour_usage: e.target.checked })}
                />
                Uso em horário de pico (18h às 21h)
              </label>
            </div>

            <h3 className="section-title">
              Seus Aparelhos
              {selectedAppliances.length > 0 && (
                <span className="appliance-count-badge">{applianceCalc.totalEquipment} equip.</span>
              )}
            </h3>
            <p className="section-subtitle">
              Adicione exatamente quais aparelhos você possui e a quantidade de cada um.
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
                Clique nos aparelhos acima para adicioná-los. Quanto mais específico, mais precisa a
                análise.
              </p>
            )}

            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? (
                "Analisando..."
              ) : (
                <>
                  <I.BarChart3 size={18} />
                  Analisar Consumo
                </>
              )}
            </button>
          </form>

          <div className="demo-result">
            {loading && (
              <div className="result-placeholder">
                <div className="spinner" />
                <p>Processando sua análise...</p>
              </div>
            )}

            {error && !loading && (
              <div className="result-error">
                <p className="error-title">{error}</p>
                {fieldErrors && Object.keys(fieldErrors).length > 0 && (
                  <ul className="error-fields">
                    {Object.entries(fieldErrors).map(([field, msg]) => (
                      <li key={field}>
                        <strong>{FIELD_NAMES[field] ?? field}:</strong> {msg}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {result && !loading && (
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
                  {result.source && <p className="result-origem">Origem: {result.source}</p>}
                </div>
              </div>
            )}

            {!result && !error && !loading && (
              <div className="result-placeholder">
                <I.BarChart3 size={48} className="placeholder-icon" />
                <p>Preencha os dados e clique em "Analisar Consumo" para ver o resultado.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
