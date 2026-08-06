import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/useAuth";
import {
  fetchDashboard,
  listAnalyses,
  fetchCategories,
  fetchPreferences,
  updatePreferences,
  listProperties,
  simulateEnergy,
} from "../services/api";
import type { DashboardData, AnalysisHistory, AnalysisResponse } from "../types";
import type { PropertyResponse } from "../services/api";
import { CATEGORY_COLORS, CATEGORY_DISPLAY } from "../types";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import {
  BarChart3,
  Zap,
  DollarSign,
  Leaf,
  TrendingUp,
  History,
  UserCog,
  ArrowUp,
  ArrowDown,
  Target,
  PiggyBank,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { resolveApplianceIcon } from "../data/appliance-icons";
import { LucideIcon } from "../components/LucideIcon";

type TimeGranularity = "month" | "day" | "hour";

const GRANULARITY_OPTIONS: {
  value: TimeGranularity;
  label: string;
  icon: string;
}[] = [
  { value: "month", label: "Mensal", icon: "Calendar" },
  { value: "day", label: "Diário", icon: "History" },
  { value: "hour", label: "Por hora", icon: "Clock" },
];

interface GranularityEntry {
  sortKey: number | string;
  label: string;
  consumptionKwh: number;
}

function aggregateByGranularity(
  analyses: AnalysisHistory[],
  granularity: TimeGranularity,
): { label: string; consumptionKwh: number }[] {
  const map = new Map<string | number, number>();
  const labelMap = new Map<string | number, string>();

  for (const a of analyses) {
    if (a.consumption_kwh == null) continue;
    const date = new Date(a.created_at);
    let sortKey: string | number;
    let label: string;

    switch (granularity) {
      case "month": {
        sortKey = date.getFullYear() * 12 + date.getMonth();
        label = date.toLocaleDateString("pt-BR", {
          month: "short",
          year: "numeric",
        });
        break;
      }
      case "day": {
        sortKey = date.toISOString().slice(0, 10);
        label = date.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "short",
        });
        break;
      }
      case "hour": {
        sortKey = date.getHours();
        label = `${String(date.getHours()).padStart(2, "0")}h`;
        break;
      }
    }

    map.set(sortKey, (map.get(sortKey) ?? 0) + a.consumption_kwh);
    labelMap.set(sortKey, label);
  }

  const entries: GranularityEntry[] = Array.from(map.entries())
    .map(([sortKey, consumptionKwh]) => ({
      sortKey,
      label: labelMap.get(sortKey) ?? String(sortKey),
      consumptionKwh,
    }))
    .sort((a, b) => {
      if (typeof a.sortKey === "number" && typeof b.sortKey === "number") {
        return a.sortKey - b.sortKey;
      }
      return String(a.sortKey).localeCompare(String(b.sortKey));
    });

  return entries.map(({ label, consumptionKwh }) => ({ label, consumptionKwh }));
}

const CATEGORY_RANK: Record<string, number> = {
  EXCELENTE: 0,
  BOM: 1,
  MEDIANO: 2,
  RUIM: 3,
  CRITICO: 4,
};

function interpretTrend(analyses: AnalysisHistory[]): {
  trend: "up" | "down" | "stable";
  percentage: number;
} {
  const valid = analyses.filter((a) => a.consumption_kwh != null);
  if (valid.length < 2) return { trend: "stable", percentage: 0 };
  const latest = valid[valid.length - 1];
  const prev = valid[valid.length - 2];
  const diff = latest.consumption_kwh - prev.consumption_kwh;
  const pct = prev.consumption_kwh > 0 ? (diff / prev.consumption_kwh) * 100 : 0;
  if (Math.abs(pct) < 3) return { trend: "stable", percentage: 0 };
  return { trend: pct > 0 ? "up" : "down", percentage: Math.abs(pct) };
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [chartHeight] = useState(() => (window.innerWidth < 480 ? 200 : 300));
  const [loading, setLoading] = useState(true);
  const [analyses, setAnalyses] = useState<AnalysisHistory[]>([]);
  const [goalKwh, setGoalKwh] = useState<number>(0);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(0);
  const [backendCategories, setBackendCategories] = useState<string[]>([]);
  const [granularity, setGranularity] = useState<TimeGranularity>("month");

  const [simTargetKwh, setSimTargetKwh] = useState(0);
  const [simResult, setSimResult] = useState<AnalysisResponse | null>(null);
  const [simLoading, setSimLoading] = useState(false);
  const [simError, setSimError] = useState<string | null>(null);
  const [properties, setProperties] = useState<PropertyResponse[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);

  const selectedProperty = useMemo(
    () => properties.find((p) => p.id === selectedPropertyId) ?? properties[0] ?? null,
    [properties, selectedPropertyId],
  );

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    Promise.all([
      fetchDashboard(),
      listAnalyses(),
      fetchCategories(),
      fetchPreferences(),
      listProperties(),
    ])
      .then(([dash, allAnalyses, cats, prefs, props]) => {
        setData(dash);
        setAnalyses(allAnalyses);
        if (cats.length > 0) setBackendCategories(cats);
        if (prefs.consumption_goal) {
          setGoalKwh(prefs.consumption_goal);
          setGoalInput(prefs.consumption_goal);
        }
        setProperties(props);
        const active = props.find((p) => p.active) ?? props[0] ?? null;
        if (active) setSelectedPropertyId(active.id);
      })
      .finally(() => setLoading(false));
  }, [user, navigate]);

  const dynamicCategoryRank = useMemo(() => {
    if (backendCategories.length === 0) return CATEGORY_RANK;
    const dynamic: Record<string, number> = {};
    backendCategories.forEach((cat, idx) => {
      dynamic[cat] = idx;
    });
    return dynamic;
  }, [backendCategories]);

  const backendCategorySet = useMemo(() => new Set(backendCategories), [backendCategories]);

  const granularData = useMemo(
    () => aggregateByGranularity(analyses, granularity),
    [analyses, granularity],
  );

  if (loading) {
    return (
      <div className="dash-page" style={{ display: "flex", justifyContent: "center" }}>
        <p>Carregando dashboard...</p>
      </div>
    );
  }

  if (!data || data.totalAnalyses === 0) {
    return (
      <div className="dash-page" style={{ textAlign: "center" }}>
        <h1
          style={{
            marginBottom: "1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.75rem",
          }}
        >
          <BarChart3 size={28} /> Dashboard
        </h1>
        <div className="history-empty">
          <p>Nenhuma análise encontrada. Configure seu perfil e faça a primeira análise!</p>
          <div
            style={{ display: "flex", gap: "0.75rem", justifyContent: "center", marginTop: "1rem" }}
          >
            <button onClick={() => navigate("/profile")} className="dash-btn dash-btn--secondary">
              <UserCog size={18} /> Criar Perfil
            </button>
            <button onClick={() => navigate("/profile")} className="dash-btn dash-btn--primary">
              Fazer análise
            </button>
          </div>
        </div>
      </div>
    );
  }

  const lastAnalysis = analyses.length > 0 ? analyses[analyses.length - 1] : null;
  const trendInfo = interpretTrend(analyses);

  const recentCategories = analyses.slice(-2).map((a) => a.category);
  const rankDiff =
    analyses.length >= 2
      ? (dynamicCategoryRank[recentCategories[1]] ?? 999) -
        (dynamicCategoryRank[recentCategories[0]] ?? 999)
      : 0;

  const currentKwh = lastAnalysis?.consumption_kwh ?? data.averageConsumptionKwh;
  const goalProgress = goalKwh > 0 ? Math.min(100, (currentKwh / goalKwh) * 100) : 0;

  return (
    <div className="dash-page">
      <div className="dash-header">
        <h1>
          <BarChart3 size={28} /> Dashboard
        </h1>
        <div className="dash-actions">
          <button onClick={() => navigate("/history")} className="dash-btn dash-btn--secondary">
            <History size={18} /> Histórico
          </button>
        </div>
      </div>

      {lastAnalysis && (
        <div className="dash-last-analysis">
          <div className="dash-last-header">
            <span className="dash-last-label">Última Análise</span>
            <span className="dash-last-date">
              {new Date(lastAnalysis.created_at).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
          <div className="dash-last-body">
            <span
              className="dash-last-badge"
              style={{
                backgroundColor:
                  CATEGORY_COLORS[lastAnalysis.category as keyof typeof CATEGORY_COLORS] ??
                  (backendCategorySet.has(lastAnalysis.category) ? "#818cf8" : "#9ca3af"),
              }}
            >
              {CATEGORY_DISPLAY[lastAnalysis.category as keyof typeof CATEGORY_DISPLAY] ??
                lastAnalysis.category}
            </span>
            <span className="dash-last-consumo">
              {(lastAnalysis.consumption_kwh ?? 0).toFixed(0)} kWh
            </span>
            <span className="dash-last-custo">
              R$ {(lastAnalysis.estimated_monthly_cost ?? 0).toFixed(2)}
            </span>
            {trendInfo.trend !== "stable" && (
              <span className={`dash-trend dash-trend--${trendInfo.trend}`}>
                {trendInfo.trend === "up" && <ArrowUp size={16} />}
                {trendInfo.trend === "down" && <ArrowDown size={16} />}
                {trendInfo.percentage.toFixed(0)}%
              </span>
            )}
          </div>
          {rankDiff !== 0 && analyses.length >= 2 && (
            <div className={`dash-progress-msg ${rankDiff > 0 ? "dash-progress-msg--worse" : ""}`}>
              {rankDiff < 0 ? <TrendingUp size={16} /> : <ArrowDown size={16} />}
              {rankDiff < 0 ? "Voce evoluiu de " : "Seu consumo piorou de "}
              <strong>
                {CATEGORY_DISPLAY[recentCategories[0] as keyof typeof CATEGORY_DISPLAY] ??
                  recentCategories[0]}
              </strong>{" "}
              para{" "}
              <strong>
                {CATEGORY_DISPLAY[recentCategories[1] as keyof typeof CATEGORY_DISPLAY] ??
                  recentCategories[1]}
              </strong>
              !
            </div>
          )}
        </div>
      )}

      <div className="dash-grid">
        <div className="dash-card">
          <div className="dash-card-header">
            <TrendingUp size={20} className="dash-card-icon" />
            <span className="dash-card-label">Total de Análises</span>
          </div>
          <p className="dash-card-value">{data.totalAnalyses}</p>
        </div>

        <div className="dash-card">
          <div className="dash-card-header">
            <Zap size={20} className="dash-card-icon" />
            <span className="dash-card-label">Média de Consumo</span>
          </div>
          <p className="dash-card-value">
            {data.averageConsumptionKwh.toFixed(0)} <span className="dash-card-unit">kWh</span>
          </p>
        </div>

        <div className="dash-card">
          <div className="dash-card-header">
            <DollarSign size={20} className="dash-card-icon" />
            <span className="dash-card-label">Custo Total</span>
          </div>
          <p className="dash-card-value">R$ {data.totalEstimatedCost.toFixed(2)}</p>
        </div>

        <div className="dash-card">
          <div className="dash-card-header">
            <Leaf size={20} className="dash-card-icon" />
            <span className="dash-card-label">CO₂ Total</span>
          </div>
          <p className="dash-card-value">
            {data.totalCo2EmissionKg.toFixed(2)} <span className="dash-card-unit">kg</span>
          </p>
        </div>
      </div>

      <div className="dash-section">
        <h3>
          <Target size={20} /> Meta de Consumo
        </h3>
        <div className="dash-goal-card">
          {editingGoal ? (
            <div className="dash-goal-edit">
              <input
                type="number"
                min="0"
                value={goalInput}
                onChange={(e) => setGoalInput(Number(e.target.value))}
                placeholder="Ex: 200 kWh"
              />
              <button
                className="dash-btn dash-btn--primary"
                onClick={async () => {
                  try {
                    await updatePreferences({ consumption_goal: goalInput });
                    setGoalKwh(goalInput);
                    setEditingGoal(false);
                  } catch {
                    // silently fail, goal stays unchanged
                  }
                }}
              >
                Salvar
              </button>
              <button
                className="dash-btn dash-btn--secondary"
                onClick={() => {
                  setEditingGoal(false);
                  setGoalInput(goalKwh);
                }}
              >
                Cancelar
              </button>
            </div>
          ) : (
            <div className="dash-goal-display">
              {goalKwh > 0 ? (
                <>
                  <div className="dash-goal-bar-container">
                    <div
                      className="dash-goal-bar"
                      style={{
                        width: `${Math.min(goalProgress, 100)}%`,
                        background:
                          goalProgress > 100
                            ? "var(--accent-red, #ef4444)"
                            : goalProgress > 80
                              ? "var(--accent-yellow, #f59e0b)"
                              : "var(--accent-green, #10b981)",
                      }}
                    />
                  </div>
                  <div className="dash-goal-stats">
                    <span>
                      Atual: <strong>{currentKwh.toFixed(0)} kWh</strong>
                    </span>
                    <span>
                      Meta: <strong>{goalKwh} kWh</strong>
                    </span>
                    <span>
                      {currentKwh <= goalKwh ? (
                        <span className="dash-goal-met">✓ Meta atingida!</span>
                      ) : (
                        <span className="dash-goal-excess">
                          Excesso: {(currentKwh - goalKwh).toFixed(0)} kWh
                        </span>
                      )}
                    </span>
                  </div>
                  <button
                    className="dash-btn dash-btn--secondary"
                    onClick={() => {
                      setEditingGoal(true);
                      setGoalInput(goalKwh);
                    }}
                    style={{ marginTop: "0.5rem", fontSize: "0.8rem" }}
                  >
                    Alterar meta
                  </button>
                </>
              ) : (
                <div className="dash-goal-empty">
                  <p>Defina uma meta mensal de consumo para acompanhar seu progresso.</p>
                  <button
                    className="dash-btn dash-btn--primary"
                    onClick={() => {
                      setEditingGoal(true);
                      setGoalInput(Math.round(currentKwh * 0.8));
                    }}
                  >
                    <Target size={16} /> Definir Meta
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {selectedProperty && properties.length > 1 && (
        <div className="property-selector">
          <span className="property-selector-label">Simular para:</span>
          <div className="property-selector-row">
            {properties.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`property-selector-btn ${selectedPropertyId === p.id ? "active" : ""}`}
                onClick={() => {
                  setSelectedPropertyId(p.id);
                  setSimResult(null);
                  setSimError(null);
                }}
              >
                <span className="property-selector-name">{p.alias}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedProperty && lastAnalysis && currentKwh > 0 && (
        <div className="dash-section">
          <h3>
            <PiggyBank size={20} /> Simule sua Economia
          </h3>
          <p className="dash-section-subtitle">
            Informe um novo consumo para simular como sua classificacao mudaria com a reducao:
          </p>
          <div className="dash-sim-card">
            <div className="dash-sim-row">
              <div className="dash-sim-current">
                <span className="dash-sim-label">Atual</span>
                <span className="dash-sim-value">{currentKwh.toFixed(0)} kWh</span>
              </div>
              <div className="dash-sim-arrow">
                <ArrowDown size={20} />
              </div>
              <div className="dash-sim-target">
                <span className="dash-sim-label">Novo consumo</span>
                <div className="dash-sim-input-group">
                  <input
                    type="number"
                    min={0}
                    max={currentKwh}
                    step={10}
                    value={simTargetKwh || Math.round(currentKwh * 0.85)}
                    onChange={(e) => {
                      setSimTargetKwh(Number(e.target.value));
                      setSimResult(null);
                      setSimError(null);
                    }}
                    className="dash-sim-input"
                  />
                  <span className="dash-sim-unit">kWh</span>
                </div>
              </div>
              <button
                className="dash-btn dash-btn--primary"
                onClick={async () => {
                  const target = simTargetKwh || Math.round(currentKwh * 0.85);
                  if (target >= currentKwh) return;
                  setSimLoading(true);
                  setSimError(null);
                  setSimResult(null);
                  try {
                    const res = await simulateEnergy(
                      selectedProperty.id,
                      target,
                      lastAnalysis.peak_hour_usage,
                      lastAnalysis.high_consumption_hours,
                      undefined,
                    );
                    setSimResult(res);
                  } catch (err) {
                    setSimError(err instanceof Error ? err.message : "Erro ao simular");
                  } finally {
                    setSimLoading(false);
                  }
                }}
                disabled={
                  simLoading || (simTargetKwh || Math.round(currentKwh * 0.85)) >= currentKwh
                }
              >
                {simLoading ? (
                  "Simulando..."
                ) : (
                  <>
                    <Sparkles size={16} /> Simular com IA
                  </>
                )}
              </button>
            </div>

            {simError && (
              <div className="dash-sim-error">
                <AlertCircle size={14} />
                <span>{simError}</span>
              </div>
            )}

            {simResult && (
              <div className="dash-sim-result">
                <div className="dash-sim-result-header">
                  <span
                    className="dash-last-badge"
                    style={{
                      backgroundColor:
                        CATEGORY_COLORS[simResult.category as keyof typeof CATEGORY_COLORS] ??
                        "#9ca3af",
                    }}
                  >
                    {CATEGORY_DISPLAY[simResult.category as keyof typeof CATEGORY_DISPLAY] ??
                      simResult.category}
                  </span>
                  <span className="dash-sim-stat">
                    Confianca: {(simResult.probability * 100).toFixed(0)}%
                  </span>
                  <span className="dash-sim-stat">
                    Custo: R$ {simResult.estimated_monthly_cost.toFixed(2)}
                  </span>
                  {simResult.source && (
                    <span className="analysis-source-badge">
                      <LucideIcon
                        name={simResult.source === "ML" ? "Sparkles" : "AlertTriangle"}
                        size={12}
                      />
                      {simResult.source === "ML" ? "Modelo ML" : "Fallback"}
                    </span>
                  )}
                </div>
                {simResult.highest_consumption_products &&
                  simResult.highest_consumption_products.length > 0 && (
                    <div className="dash-sim-products">
                      <span className="dash-sim-products-label">Maiores consumidores:</span>
                      <span className="dash-sim-products-list">
                        {simResult.highest_consumption_products.map((product, i) => (
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
              </div>
            )}
          </div>
        </div>
      )}

      {granularData.length > 0 && (
        <div className="dash-chart">
          <div className="dash-chart-header">
            <h3>
              <TrendingUp size={20} /> Consumo (kWh)
            </h3>
            <div className="dash-granularity-tabs">
              {GRANULARITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  className={`dash-gran-tab ${granularity === opt.value ? "dash-gran-tab--active" : ""}`}
                  onClick={() => setGranularity(opt.value)}
                >
                  <LucideIcon name={opt.icon} size={14} /> {opt.label}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart data={granularData}>
              <XAxis
                dataKey="label"
                tick={{ fill: "var(--text-primary)", fontSize: 12, opacity: 0.7 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "var(--text-primary)", fontSize: 12, opacity: 0.7 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: "var(--bg-surface-alt)" }}
                contentStyle={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--ink)",
                  borderRadius: 8,
                  color: "var(--text-primary)",
                }}
                formatter={(value: unknown) => {
                  const v = typeof value === "number" ? value : 0;
                  return [`${v.toFixed(1)} kWh`, "Consumo"];
                }}
              />
              <Bar dataKey="consumptionKwh" fill="var(--accent-green)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
