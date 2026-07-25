import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { fetchDashboard, listAnalyses } from "../services/api";
import type { DashboardData, AnalysisHistory } from "../types";
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
  Lightbulb,
  PiggyBank,
} from "lucide-react";

const KWH_TARIFF = 0.75;

function savingsSimulation(currentKwh: number, reductionKwh: number) {
  const saving = reductionKwh * KWH_TARIFF;
  const newKwh = Math.max(0, currentKwh - reductionKwh);
  return { saving, newKwh, reductionKwh };
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
  if (analyses.length < 2) return { trend: "stable", percentage: 0 };
  const latest = analyses[analyses.length - 1];
  const prev = analyses[analyses.length - 2];
  const diff = latest.consumption_kwh - prev.consumption_kwh;
  const pct = prev.consumption_kwh > 0 ? (diff / prev.consumption_kwh) * 100 : 0;
  if (Math.abs(pct) < 3) return { trend: "stable", percentage: 0 };
  return { trend: pct > 0 ? "up" : "down", percentage: Math.abs(pct) };
}

const SAVINGS_RATES = [0.1, 0.2, 0.3, 0.4];
const GOAL_KEY = "energiai_goal_kwh";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [chartHeight] = useState(() => (window.innerWidth < 480 ? 200 : 300));
  const [loading, setLoading] = useState(true);
  const [analyses, setAnalyses] = useState<AnalysisHistory[]>([]);
  const [goalKwh, setGoalKwh] = useState<number>(() => {
    const saved = localStorage.getItem(GOAL_KEY);
    return saved ? Number(saved) : 0;
  });
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(goalKwh);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    Promise.all([fetchDashboard(), listAnalyses()])
      .then(([dash, allAnalyses]) => {
        setData(dash);
        setAnalyses(allAnalyses);
      })
      .finally(() => setLoading(false));
  }, [user, navigate]);

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
            <button onClick={() => navigate("/analysis")} className="dash-btn dash-btn--primary">
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
      ? CATEGORY_RANK[recentCategories[1]] - CATEGORY_RANK[recentCategories[0]]
      : 0;

  const currentKwh = lastAnalysis?.consumption_kwh ?? data.averageConsumptionKwh;
  const savingsPresets = SAVINGS_RATES.map((rate) => Math.max(10, Math.round(currentKwh * rate)));
  const simulations = savingsPresets.map((r) => ({
    ...savingsSimulation(currentKwh, r),
    label: `${r} kWh/mês - ${((r / currentKwh) * 100).toFixed(0)}%`,
  }));

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
                  "#6b7280",
              }}
            >
              {CATEGORY_DISPLAY[lastAnalysis.category as keyof typeof CATEGORY_DISPLAY] ??
                lastAnalysis.category}
            </span>
            <span className="dash-last-consumo">{lastAnalysis.consumption_kwh.toFixed(0)} kWh</span>
            <span className="dash-last-custo">
              R$ {lastAnalysis.estimated_monthly_cost.toFixed(2)}
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
                {CATEGORY_DISPLAY[recentCategories[0] as keyof typeof CATEGORY_DISPLAY]}
              </strong>{" "}
              para{" "}
              <strong>
                {CATEGORY_DISPLAY[recentCategories[1] as keyof typeof CATEGORY_DISPLAY]}
              </strong>
              !
            </div>
          )}
        </div>
      )}

      <div className="dash-actions-row">
        <button onClick={() => navigate("/profile")} className="dash-btn dash-btn--secondary">
          <UserCog size={18} /> Meu Perfil
        </button>
        <button onClick={() => navigate("/analysis")} className="dash-btn dash-btn--primary">
          <BarChart3 size={18} /> Nova análise
        </button>
      </div>

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
                onClick={() => {
                  setGoalKwh(goalInput);
                  localStorage.setItem(GOAL_KEY, String(goalInput));
                  setEditingGoal(false);
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

      {lastAnalysis && currentKwh > 0 && (
        <div className="dash-section">
          <h3>
            <PiggyBank size={20} /> Simule sua Economia
          </h3>
          <p className="dash-section-subtitle">
            Veja quanto voce pode economizar reduzindo seu consumo mensal:
          </p>
          <div className="dash-simulation-grid">
            {simulations.map((sim) => (
              <div key={sim.reductionKwh} className="dash-simulation-card">
                <Lightbulb size={20} className="sim-icon" />
                <div className="sim-details">
                  <span className="sim-reduction">Reduza {sim.reductionKwh} kWh</span>
                  <span className="sim-consumption">Novo consumo: {sim.newKwh.toFixed(0)} kWh</span>
                </div>
                <span className="sim-saving">+ R$ {sim.saving.toFixed(2)}/mes</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.monthlyConsumption.length > 0 && (
        <div className="dash-chart">
          <h3>
            <TrendingUp size={20} /> Consumo por Mês (kWh)
          </h3>
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart data={data.monthlyConsumption}>
              <XAxis
                dataKey="month"
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
                contentStyle={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--ink)",
                  borderRadius: 8,
                  color: "var(--text-primary)",
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
