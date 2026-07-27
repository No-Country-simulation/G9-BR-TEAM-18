import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { listAnalyses, fetchAnalysisById } from "../services/api";
import type { AnalysisHistory, ApplianceSnapshot } from "../types";
import { CATEGORY_COLORS, CATEGORY_DISPLAY } from "../types";
import {
  Clock,
  Zap,
  DollarSign,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Clock as ClockIcon,
  BarChart3,
  Lightbulb,
  Target,
  X,
  Calendar,
  RotateCcw,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ReactNode } | undefined
> = {
  CONCLUIDA: { label: "Concluida", color: "#10b981", icon: <CheckCircle size={14} /> },
  PENDENTE: { label: "Pendente", color: "#f59e0b", icon: <ClockIcon size={14} /> },
  FALHA: { label: "Falha", color: "#ef4444", icon: <AlertCircle size={14} /> },
};

function badgeStyle(cat: string): React.CSSProperties {
  const bg = CATEGORY_COLORS[cat as keyof typeof CATEGORY_COLORS] ?? "#ef4444";
  return { background: bg };
}

function ApplianceTable({ appliances }: { appliances: ApplianceSnapshot[] }) {
  if (!appliances.length) return null;

  const sorted = [...appliances].sort(
    (a, b) => b.monthly_consumption_kwh - a.monthly_consumption_kwh,
  );

  return (
    <div className="hist-table-section">
      <h4>
        <BarChart3 size={16} /> Detalhamento por Equipamento
      </h4>
      <div className="hist-table-wrapper">
        <table className="hist-table">
          <thead>
            <tr>
              <th>Equipamento</th>
              <th>Qtd</th>
              <th>Potência (W)</th>
              <th>Uso/dia (h)</th>
              <th>kWh/mês</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((a, i) => (
              <tr key={i}>
                <td className="hist-td-name">{a.name}</td>
                <td>{a.quantity}</td>
                <td>{a.average_power_watts.toFixed(0)}</td>
                <td>{a.average_daily_use_hours.toFixed(1)}</td>
                <td className="hist-td-kwh">{a.monthly_consumption_kwh.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4} className="hist-tfoot-label">Total</td>
              <td className="hist-td-kwh">
                {sorted.reduce((s, a) => s + a.monthly_consumption_kwh, 0).toFixed(1)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function ApplianceChart({ appliances }: { appliances: ApplianceSnapshot[] }) {
  if (!appliances.length) return null;

  const sorted = [...appliances].sort(
    (a, b) => b.monthly_consumption_kwh - a.monthly_consumption_kwh,
  );

  // Adiciona a quantidade ao nome para exibicao: "Geladeira x2"
  const chartData = sorted.map((a) => ({
    ...a,
    label: a.quantity > 1 ? `${a.name} x${a.quantity}` : a.name,
  }));

  return (
    <div className="hist-chart-section">
      <h4>
        <BarChart3 size={16} /> Consumo por Equipamento (kWh/mês)
      </h4>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 4, right: 20, bottom: 4, left: 20 }}
        >
          <XAxis
            type="number"
            tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="label"
            tick={{
              fill: "var(--text-primary)",
              fontSize: 11,
              width: 180,
            }}
            axisLine={false}
            tickLine={false}
            width={180}
          />
          <Tooltip
            contentStyle={{
              background: "var(--bg-surface)",
              border: "1px solid var(--ink)",
              borderRadius: 8,
              color: "var(--text-primary)",
              fontSize: "0.8rem",
            }}
            formatter={(_value: unknown) => {
              const v = typeof _value === "number" ? _value : 0;
              return [`${v.toFixed(1)} kWh/mês`, "Consumo"];
            }}
          />
          <Bar
            dataKey="monthly_consumption_kwh"
            fill="var(--accent-cyan)"
            radius={[0, 4, 4, 0]}
            barSize={18}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function AnalysisDetail({
  analysis,
  onClose,
}: {
  analysis: AnalysisHistory;
  onClose: () => void;
}) {
  return (
    <div className="hist-modal-overlay" onClick={onClose}>
      <div className="hist-modal" onClick={(e) => e.stopPropagation()}>
        <button className="hist-modal-close" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="hist-modal-header">
          <span className="history-item-cat" style={badgeStyle(analysis.category)}>
            {CATEGORY_DISPLAY[analysis.category] ?? analysis.category}
          </span>
          {analysis.status && analysis.status !== "CONCLUIDA" && (
            <span
              className="history-item-status"
              style={{
                background: STATUS_CONFIG[analysis.status]?.color ?? "#6b7280",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.25rem",
                padding: "0.15rem 0.5rem",
                borderRadius: "999px",
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "#fff",
                whiteSpace: "nowrap",
              }}
            >
              {STATUS_CONFIG[analysis.status]?.icon}
              {STATUS_CONFIG[analysis.status]?.label ?? analysis.status}
            </span>
          )}
          <span className="hist-modal-date">
            {new Date(analysis.created_at).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        <div className="hist-modal-stats">
          <div className="hist-stat">
            <span className="hist-stat-label">Consumo</span>
            <span className="hist-stat-value">
              <Zap size={16} /> {(analysis.consumption_kwh ?? 0).toFixed(0)} kWh
            </span>
          </div>
          <div className="hist-stat">
            <span className="hist-stat-label">Custo</span>
            <span className="hist-stat-value">
              <DollarSign size={16} /> R$ {(analysis.estimated_monthly_cost ?? 0).toFixed(2)}
            </span>
          </div>
          <div className="hist-stat">
            <span className="hist-stat-label">Probabilidade</span>
            <span className="hist-stat-value">
              <Target size={16} /> {(analysis.probability * 100).toFixed(0)}%
            </span>
          </div>
          <div className="hist-stat">
            <span className="hist-stat-label">Pico</span>
            <span className="hist-stat-value">
              {analysis.peak_hour_usage ? "Sim" : "Não"}
            </span>
          </div>
        </div>

        {analysis.appliances && analysis.appliances.length > 0 && (
          <>
            <ApplianceChart appliances={analysis.appliances} />
            <ApplianceTable appliances={analysis.appliances} />
          </>
        )}

        {analysis.recommendations && analysis.recommendations.length > 0 && (
          <div className="hist-modal-recs">
            <h4>
              <Lightbulb size={16} /> Recomendações
            </h4>
            <ul>
              {analysis.recommendations.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default function History() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState<AnalysisHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AnalysisHistory | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filteredAnalyses = useMemo(() => {
    return analyses.filter((a) => {
      const d = new Date(a.created_at);
      if (dateFrom && d < new Date(dateFrom)) return false;
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        if (d > end) return false;
      }
      return true;
    });
  }, [analyses, dateFrom, dateTo]);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    listAnalyses()
      .then(setAnalyses)
      .finally(() => setLoading(false));
  }, [user, navigate]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    setLoadingDetail(true);
    fetchAnalysisById(selectedId)
      .then((data) => {
        setDetail(data);
      })
      .finally(() => setLoadingDetail(false));
  }, [selectedId]);

  if (loading) {
    return (
      <div className="history-page" style={{ display: "flex", justifyContent: "center" }}>
        <p>Carregando histórico...</p>
      </div>
    );
  }

  return (
    <div className="history-page">
      <button
        onClick={() => navigate("/dashboard")}
        className="dash-btn dash-btn--secondary"
        style={{ marginBottom: "1.5rem", padding: "0.4rem 1rem" }}
      >
        <ArrowLeft size={16} /> Voltar
      </button>

      <div className="history-header">
        <h1>
          <Clock size={28} /> Historico
        </h1>
        <button onClick={() => navigate("/profile")} className="dash-btn dash-btn--primary">
          Nova análise
        </button>
      </div>

      {analyses.length > 0 && (
        <div className="hist-filter-bar">
          <Calendar size={16} className="hist-filter-icon" />
          <label className="hist-filter-label">De</label>
          <input
            type="date"
            className="hist-filter-input"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
          <label className="hist-filter-label">Ate</label>
          <input
            type="date"
            className="hist-filter-input"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
          {(dateFrom || dateTo) && (
            <button
              className="hist-filter-clear"
              onClick={() => {
                setDateFrom("");
                setDateTo("");
              }}
              title="Limpar filtro"
            >
              <RotateCcw size={14} />
            </button>
          )}
          <span className="hist-filter-count">
            {filteredAnalyses.length} de {analyses.length}
          </span>
        </div>
      )}

      {filteredAnalyses.length === 0 ? (
        <div className="history-empty">
          {analyses.length === 0 ? (
            <>
              <p>Nenhuma análise encontrada.</p>
              <button onClick={() => navigate("/profile")} className="dash-btn dash-btn--primary">
                Fazer primeira análise
              </button>
            </>
          ) : (
            <p>Nenhuma análise no período selecionado.</p>
          )}
        </div>
      ) : (
        <div className="history-list">
          {filteredAnalyses.map((a) => (
            <div
              key={a.id}
              className={`history-item ${selectedId === a.id ? "history-item--active" : ""}`}
              onClick={() => setSelectedId(a.id)}
              style={{ cursor: "pointer" }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  {a.status && a.status !== "CONCLUIDA" && (
                    <span
                      className="history-item-status"
                      style={{
                        background: STATUS_CONFIG[a.status]?.color ?? "#6b7280",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.25rem",
                        padding: "0.15rem 0.5rem",
                        borderRadius: "999px",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        color: "#fff",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {STATUS_CONFIG[a.status]?.icon}
                      {STATUS_CONFIG[a.status]?.label ?? a.status}
                    </span>
                  )}
                  <span className="history-item-cat" style={badgeStyle(a.category)}>
                    {CATEGORY_DISPLAY[a.category] ?? a.category}
                  </span>
                  <span className="history-item-date">
                    {new Date(a.created_at).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "1.5rem",
                    flexWrap: "wrap",
                    fontSize: "0.9rem",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    <Zap size={14} /> {(a.consumption_kwh ?? 0).toFixed(0)} kWh
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    <DollarSign size={14} /> R$ {(a.estimated_monthly_cost ?? 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {loadingDetail && (
        <div className="hist-modal-overlay">
          <div className="hist-modal" style={{ textAlign: "center", padding: "3rem" }}>
            <div className="spinner" style={{ margin: "0 auto" }} />
            <p style={{ marginTop: "1rem", color: "var(--text-secondary)" }}>
              Carregando relatório...
            </p>
          </div>
        </div>
      )}

      {detail && !loadingDetail && (
        <AnalysisDetail analysis={detail} onClose={() => setSelectedId(null)} />
      )}
    </div>
  );
}
