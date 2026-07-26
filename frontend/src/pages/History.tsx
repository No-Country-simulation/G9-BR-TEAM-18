import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { listAnalyses } from "../services/api";
import type { AnalysisHistory } from "../types";
import { CATEGORY_COLORS, CATEGORY_DISPLAY } from "../types";
import {
  Clock,
  Zap,
  DollarSign,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Clock as ClockIcon,
} from "lucide-react";

export default function History() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState<AnalysisHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    listAnalyses()
      .then(setAnalyses)
      .finally(() => setLoading(false));
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="history-page" style={{ display: "flex", justifyContent: "center" }}>
        <p>Carregando histórico...</p>
      </div>
    );
  }

  const STATUS_CONFIG: Record<
    string,
    { label: string; color: string; icon: React.ReactNode } | undefined
  > = {
    CONCLUIDA: { label: "Concluida", color: "#10b981", icon: <CheckCircle size={14} /> },
    PENDENTE: { label: "Pendente", color: "#f59e0b", icon: <ClockIcon size={14} /> },
    FALHA: { label: "Falha", color: "#ef4444", icon: <AlertCircle size={14} /> },
  };

  const badgeStyle = (cat: string): React.CSSProperties => {
    const bg = CATEGORY_COLORS[cat as keyof typeof CATEGORY_COLORS] ?? "#ef4444";
    return { background: bg };
  };

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
          <Clock size={28} /> Histórico
        </h1>
        <button onClick={() => navigate("/profile")} className="dash-btn dash-btn--primary">
          Nova análise
        </button>
      </div>

      {analyses.length === 0 ? (
        <div className="history-empty">
          <p>Nenhuma análise encontrada.</p>
          <button onClick={() => navigate("/profile")} className="dash-btn dash-btn--primary">
            Fazer primeira análise
          </button>
        </div>
      ) : (
        <div className="history-list">
          {analyses.map((a) => (
            <div key={a.id} className="history-item">
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
                  style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", fontSize: "0.9rem" }}
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
    </div>
  );
}
