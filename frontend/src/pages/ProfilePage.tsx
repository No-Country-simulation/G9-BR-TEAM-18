import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/useAuth";
import { LucideIcon } from "../components/LucideIcon";
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
  PROPERTY_TYPE_LABELS,
  DEFAULT_PROPERTY_TYPES,
  REGULARITY_OPTIONS,
} from "../types";
import { resolveApplianceIcon, getCategoryDisplay, sortCategories } from "../data/appliance-icons";
import {
  listProperties,
  createProperty,
  updateProperty,
  listAppliances,
  fetchCategories,
  fetchContractInfo,
  fetchPreferences,
  updatePreferences,
  listPropertyAppliances,
  batchUpdateAppliances,
  analyzeEnergy,
  listAnalyses,
} from "../services/api";
import type { PropertyResponse } from "../services/api";

export default function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [property, setProperty] = useState<PropertyResponse | null>(null);
  const [aliasInput, setAliasInput] = useState("");
  const [propertyType, setPropertyType] = useState<PropertyType>("RESIDENCIAL");
  // Tipos de imóvel dinâmicos vindos do GET /contract-info (F063 / ADR-0027),
  // com fallback local caso o endpoint falhe.
  const [propertyTypeOptions, setPropertyTypeOptions] =
    useState<PropertyType[]>(DEFAULT_PROPERTY_TYPES);
  const [address, setAddress] = useState("");
  const [residentCount, setResidentCount] = useState(1);
  const [areaSqm, setAreaSqm] = useState(50);
  const [peakHourUsage, setPeakHourUsage] = useState(false);
  const [highConsumptionHours, setHighConsumptionHours] = useState(6);
  const [selectedAppliances, setSelectedAppliances] = useState<ApplianceItem[]>([]);
  const [applianceTypes, setApplianceTypes] = useState<ApplianceType[]>([]);
  const [regularity, setRegularity] = useState<Regularity>("instantanea");
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");

  /*
   * fetchCategories() retorna categorias de EFICIÊNCIA ("EXCELENTE", "BOM"…),
   * NÃO categorias de consumo ("REFRIGERATION", "CLIMATE_CONTROL"…).
   * Por isso é usado apenas como fallback de cor no badge do resultado,
   * e NÃO para alimentar getCategoryDisplay() / sortCategories(), que
   * operam sobre categorias de consumo extraídas dinamicamente dos appliances.
   */
  const [backendCategorySet, setBackendCategorySet] = useState<Set<string>>(new Set());

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
    Promise.all([
      listAppliances(),
      listProperties(),
      fetchCategories(),
      fetchContractInfo(),
      fetchPreferences(),
    ])
      .then(([appls, props, cats, contractInfo, prefs]) => {
        if (cats.length > 0) setBackendCategorySet(new Set(cats));
        setApplianceTypes(appls);
        if (contractInfo.propertyTypes.length > 0) {
          setPropertyTypeOptions(contractInfo.propertyTypes as PropertyType[]);
        }
        // Carrega preferências ANTES do branch de imóvel ativo: o return precoce
        // abaixo pulava o setRegularity para quem já tem imóvel (bug).
        if (prefs.regularity) {
          setRegularity(prefs.regularity as Regularity);
        }
        // F069 / ADR-0046: hábitos de consumo persistidos no usuário (B051)
        if (typeof prefs.peak_hour_usage === "boolean") {
          setPeakHourUsage(prefs.peak_hour_usage);
        }
        if (typeof prefs.high_consumption_hours === "number") {
          setHighConsumptionHours(prefs.high_consumption_hours);
        }
        const active = props.find((p) => p.active) ?? props[0] ?? null;
        if (active) {
          setProperty(active);
          setAliasInput(active.alias);
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
  }, [user, navigate]);

  const dynamicCategoryOrder = useMemo(() => {
    const cats = new Set(applianceTypes.map((t) => t.mlCategory));
    return sortCategories(Array.from(cats));
  }, [applianceTypes]);

  const categoriesLoaded = useRef(false);

  // Abre automaticamente as 3 primeiras categorias quando os dados carregam
  useEffect(() => {
    if (dynamicCategoryOrder.length > 0 && !categoriesLoaded.current) {
      categoriesLoaded.current = true;
      setOpenCategories(new Set(dynamicCategoryOrder.slice(0, 3)));
    }
  }, [dynamicCategoryOrder]);

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
        highestConsumptionProducts: [] as string[],
      };
    }
    const aggregated: Record<string, number> = {};
    let totalConsumption = 0;
    let totalQty = 0;
    const productConsumptions: { name: string; monthlyKwh: number }[] = [];
    for (const item of selectedAppliances) {
      const appliance = applianceTypes.find((t) => t.id === item.type);
      if (!appliance) continue;
      const dailyKwh = (appliance.powerWatts * appliance.dailyUsageHours * item.quantity) / 1000;
      const monthlyKwh = dailyKwh * 30;
      totalConsumption += monthlyKwh;
      totalQty += item.quantity;
      const totalW = appliance.powerWatts * item.quantity;
      const cat = appliance.mlCategory;
      aggregated[cat] = (aggregated[cat] ?? 0) + totalW;
      productConsumptions.push({ name: appliance.name, monthlyKwh });
    }
    productConsumptions.sort((a, b) => b.monthlyKwh - a.monthlyKwh);
    const topProducts = productConsumptions.slice(0, 3).map((p) => p.name);
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
      highestConsumptionProducts: topProducts,
    };
  }, [selectedAppliances, applianceTypes]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      let prop = property;
      const aliasValue = aliasInput.trim() || "Meu Imóvel";
      if (prop) {
        prop = await updateProperty(
          prop.id,
          aliasValue,
          propertyType,
          true,
          address,
          residentCount,
          areaSqm,
        );
      } else {
        prop = await createProperty(aliasValue, propertyType, address, residentCount, areaSqm);
      }
      setProperty(prop);

      const batchItems = selectedAppliances
        .map((item) => {
          const appliance = applianceTypes.find((t) => t.id === item.type);
          return appliance ? { appliance_id: Number(appliance.id), quantity: item.quantity } : null;
        })
        .filter((x): x is { appliance_id: number; quantity: number } => x !== null);

      if (batchItems.length > 0) {
        await batchUpdateAppliances(prop.id, batchItems);
      }

      await updatePreferences({
        regularity,
        // F069 / ADR-0046: persistir hábitos de consumo no usuário
        peak_hour_usage: peakHourUsage,
        high_consumption_hours: highConsumptionHours,
      }).catch(() => {});
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
      const rawConsumption =
        selectedAppliances.length > 0 ? applianceCalc.monthlyConsumptionKwh : 300;
      const consumptionKwh = Number(rawConsumption.toFixed(2));
      const res = await analyzeEnergy(
        property.id,
        consumptionKwh,
        peakHourUsage,
        highConsumptionHours,
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
          <LucideIcon name="UserCog" size={28} />
          <h1>Meu Perfil</h1>
          <p>Configure seu tipo de residência e os aparelhos que você possui.</p>
        </div>

        {error && (
          <div className="profile-error">
            <LucideIcon name="AlertCircle" size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="profile-grid">
          <div className="profile-form">
            <h3 className="section-title">Dados do Imóvel</h3>

            <div className="form-group">
              <label>Nome do imóvel</label>
              <input
                type="text"
                placeholder="Ex: Casa, Apartamento"
                value={aliasInput}
                onChange={(e) => setAliasInput(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Tipo de imóvel</label>
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value as PropertyType)}
              >
                {propertyTypeOptions.map((t) => (
                  <option key={t} value={t}>
                    {PROPERTY_TYPE_LABELS[t as PropertyType] ?? t}
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

            <h3 className="section-title">Hábitos de Consumo</h3>

            <div className="form-group">
              <label htmlFor="pico" className="checkbox-label">
                <input
                  id="pico"
                  type="checkbox"
                  checked={peakHourUsage}
                  onChange={(e) => setPeakHourUsage(e.target.checked)}
                />
                Uso em horário de pico (18h às 21h)
              </label>
            </div>

            <div className="form-group">
              <label htmlFor="horas-alto-consumo">Horas de alto consumo por dia</label>
              <input
                id="horas-alto-consumo"
                type="number"
                min="0"
                max="24"
                step="0.5"
                value={highConsumptionHours}
                onChange={(e) => setHighConsumptionHours(Number(e.target.value))}
              />
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
              <LucideIcon name="Search" size={16} className="search-icon" />
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
              {dynamicCategoryOrder.map((cat) => {
                const catInfo = getCategoryDisplay(cat);
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
                      {isOpen ? (
                        <LucideIcon name="ChevronDown" size={16} />
                      ) : (
                        <LucideIcon name="ChevronRight" size={16} />
                      )}
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
                            <LucideIcon name="Minus" size={14} />
                          </button>
                          <span className="qty-value">{item.quantity}</span>
                          <button
                            type="button"
                            className="qty-btn"
                            onClick={() => changeQuantity(item.type, 1)}
                            aria-label={`Aumentar quantidade de ${info.name}`}
                          >
                            <LucideIcon name="Plus" size={14} />
                          </button>
                        </div>
                        <button
                          type="button"
                          className="remove-btn"
                          onClick={() => removeAppliance(item.type)}
                          aria-label={`Remover ${info.name} da lista`}
                        >
                          <LucideIcon name="Trash2" size={14} />
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
                  {opt.value === "instantanea" && <LucideIcon name="Zap" size={16} />}
                  {opt.value === "diaria" && <LucideIcon name="Sun" size={16} />}
                  {opt.value === "semanal" && <LucideIcon name="Calendar" size={16} />}
                  {opt.value === "mensal" && <LucideIcon name="CalendarDays" size={16} />}
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
                  <LucideIcon name="Save" size={18} /> Salvar Perfil
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
                    <LucideIcon name="BarChart3" size={18} /> Analisar Agora
                  </>
                )}
              </button>
            )}

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
                    style={{
                      backgroundColor:
                        CATEGORY_COLORS[result.category] ??
                        (backendCategorySet.has(result.category) ? "#6366f1" : "#6b7280"),
                    }}
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
                  {result.highest_consumption_products &&
                    result.highest_consumption_products.length > 0 && (
                      <div className="dash-sim-products" style={{ marginTop: "1rem" }}>
                        <span className="dash-sim-products-label">Maiores consumidores:</span>
                        <span className="dash-sim-products-list">
                          {result.highest_consumption_products.map((product, i) => (
                            <span key={i} className="dash-sim-product-tag">
                              <LucideIcon
                                name={resolveApplianceIcon(product, "")}
                                size={14}
                                className="appliance-icon-inline"
                              />
                              {product}
                            </span>
                          ))}
                        </span>
                      </div>
                    )}
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
                    <LucideIcon name="Clock" size={18} /> Última Análise
                  </h3>
                  <div
                    className="profile-last-badge"
                    style={{
                      backgroundColor:
                        CATEGORY_COLORS[lastAnalysis.category as keyof typeof CATEGORY_COLORS] ??
                        (backendCategorySet.has(lastAnalysis.category) ? "#6366f1" : "#6b7280"),
                    }}
                  >
                    {CATEGORY_DISPLAY[lastAnalysis.category as keyof typeof CATEGORY_DISPLAY] ??
                      lastAnalysis.category}
                  </div>
                  <div className="profile-last-stats">
                    <span>Confiança: {(lastAnalysis.probability * 100).toFixed(0)}%</span>
                    <span>Custo: R$ {(lastAnalysis.cost ?? 0).toFixed(2)}</span>
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
                  <LucideIcon name="UserCog" size={48} className="placeholder-icon" />
                  <p>Configure seu perfil e clique em "Analisar Agora" para ver o resultado.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
