import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
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
  Minus,
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastAnalysis, setLastAnalysis] = useState<AnalysisHistory | null>(null);
  const [trend, setTrend] = useState<"up" | "down" | "stable" | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    Promise.all([fetchDashboard(), listAnalyses()])
      .then(([dash, analyses]) => {
        setData(dash);
        if (analyses.length > 0) {
          const latest = analyses[analyses.length - 1];
          setLastAnalysis(latest);
          if (analyses.length >= 2) {
            const prev = analyses[analyses.length - 2];
            if (latest.consumption_kwh > prev.consumption_kwh) setTrend("up");
            else if (latest.consumption_kwh < prev.consumption_kwh) setTrend("down");
            else setTrend("stable");
          }
        }
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
            {trend && (
              <span className={`dash-trend dash-trend--${trend}`}>
                {trend === "up" && <ArrowUp size={16} />}
                {trend === "down" && <ArrowDown size={16} />}
                {trend === "stable" && <Minus size={16} />}
                {trend === "up" ? "Subiu" : trend === "down" ? "Caiu" : "Estável"}
              </span>
            )}
          </div>
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
            <span className="dash-card-label">CO\u2082 Total</span>
          </div>
          <p className="dash-card-value">
            {data.totalCo2EmissionKg.toFixed(2)} <span className="dash-card-unit">kg</span>
          </p>
        </div>
      </div>

      {data.monthlyConsumption.length > 0 && (
        <div className="dash-chart">
          <h3>
            <TrendingUp size={20} /> Consumo por Mês (kWh)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
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
