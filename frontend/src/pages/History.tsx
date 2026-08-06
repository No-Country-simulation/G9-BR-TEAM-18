import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/useAuth";
import { listAnalyses, fetchAnalysisById, deleteAnalysis } from "../services/api";
import type { AnalysisHistory, ApplianceSnapshot } from "../types";
import { CATEGORY_COLORS, CATEGORY_DISPLAY } from "../types";
import { resolveApplianceIcon } from "../data/appliance-icons";
import { LucideIcon } from "../components/LucideIcon";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string } | undefined> = {
  CONCLUIDA: { label: "Concluída", color: "#10b981", icon: "CheckCircle" },
  PENDENTE: { label: "Pendente", color: "#f59e0b", icon: "Clock" },
  FALHA: { label: "Falha", color: "#ef4444", icon: "AlertCircle" },
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
        <LucideIcon name="BarChart3" size={16} /> Detalhamento por Equipamento
      </h4>
      <div className="hist-table-wrapper">
        <table className="hist-table">
          <thead>
            <tr>
              <th className="hist-th-icon"></th>
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
                <td className="hist-td-icon">
                  <LucideIcon
                    name={resolveApplianceIcon(a.name, a.category)}
                    size={16}
                    className="appliance-icon-inline"
                  />
                </td>
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
              <td colSpan={5} className="hist-tfoot-label">
                Total
              </td>
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
        <LucideIcon name="BarChart3" size={16} /> Consumo por Equipamento (kWh/mês)
      </h4>
      <ResponsiveContainer width="100%" height={Math.max(260, appliances.length * 48)}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 8, right: 16, bottom: 8, left: 160 }}
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
            width={160}
            tick={{ fill: "var(--text-primary)", fontSize: 11 }}
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
            barSize={24}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function AnalysisDetail({ analysis, onClose }: { analysis: AnalysisHistory; onClose: () => void }) {
  // Fecha o modal de detalhe com a tecla Escape (acessibilidade).
  // O listener é adicionado na montagem e removido no desmonte (cleanup).
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="hist-modal-overlay" onClick={onClose}>
      <div
        className="hist-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Detalhes da análise"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="hist-modal-close" onClick={onClose}>
          <LucideIcon name="X" size={20} />
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
              {STATUS_CONFIG[analysis.status] && (
                <LucideIcon name={STATUS_CONFIG[analysis.status]!.icon} size={14} />
              )}
              {STATUS_CONFIG[analysis.status]?.label ?? analysis.status}
            </span>
          )}
          {analysis.source && (
            <span className="analysis-source-badge">
              <LucideIcon
                name={analysis.source === "ML" ? "Sparkles" : "AlertTriangle"}
                size={12}
              />
              {analysis.source === "ML" ? "Modelo ML" : "Fallback"}
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
        {analysis.updated_at && analysis.updated_at !== analysis.created_at && (
          <div className="hist-modal-updated">
            Atualizado em{" "}
            {new Date(analysis.updated_at).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        )}

        <div className="hist-modal-stats">
          <div className="hist-stat">
            <span className="hist-stat-label">Consumo</span>
            <span className="hist-stat-value">
              <LucideIcon name="Zap" size={16} /> {(analysis.consumption_kwh ?? 0).toFixed(0)} kWh
            </span>
          </div>
          <div className="hist-stat">
            <span className="hist-stat-label">Custo</span>
            <span className="hist-stat-value">
              <LucideIcon name="DollarSign" size={16} /> R${" "}
              {(analysis.estimated_monthly_cost ?? 0).toFixed(2)}
            </span>
          </div>
          <div className="hist-stat">
            <span className="hist-stat-label">Probabilidade</span>
            <span className="hist-stat-value">
              <LucideIcon name="Target" size={16} /> {(analysis.probability * 100).toFixed(0)}%
            </span>
          </div>
          <div className="hist-stat">
            <span className="hist-stat-label">Pico</span>
            <span className="hist-stat-value">{analysis.peak_hour_usage ? "Sim" : "Não"}</span>
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
              <LucideIcon name="Lightbulb" size={16} /> Recomendações
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
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const filteredAnalyses = useMemo(() => {
    return analyses
      .filter((a) => {
        const d = new Date(a.created_at);
        if (dateFrom && d < new Date(dateFrom)) return false;
        if (dateTo) {
          const end = new Date(dateTo);
          end.setHours(23, 59, 59, 999);
          if (d > end) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const da = new Date(a.created_at).getTime();
        const db = new Date(b.created_at).getTime();
        return sortOrder === "desc" ? db - da : da - db;
      });
  }, [analyses, dateFrom, dateTo, sortOrder]);

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
      // eslint-disable-next-line react-hooks/set-state-in-effect
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

  // Fecha o modal de confirmação com a tecla Escape (acessibilidade)
  useEffect(() => {
    if (!confirmDeleteId) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !deleting) setConfirmDeleteId(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [confirmDeleteId, deleting]);

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
        <LucideIcon name="ArrowLeft" size={16} /> Voltar
      </button>

      <div className="history-header">
        <h1>
          <LucideIcon name="Clock" size={28} /> Histórico
        </h1>
        <button onClick={() => navigate("/profile")} className="dash-btn dash-btn--primary">
          Nova análise
        </button>
      </div>

      {analyses.length > 0 && (
        <div className="hist-filter-bar">
          <LucideIcon name="Calendar" size={16} className="hist-filter-icon" />
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
          <button
            className="hist-filter-sort"
            onClick={() => setSortOrder((o) => (o === "desc" ? "asc" : "desc"))}
            title={sortOrder === "desc" ? "Mais antigas primeiro" : "Mais recentes primeiro"}
          >
            <LucideIcon name="ArrowUpDown" size={14} />
            <span>{sortOrder === "desc" ? "Recentes" : "Antigas"}</span>
          </button>
          {(dateFrom || dateTo) && (
            <button
              className="hist-filter-clear"
              onClick={() => {
                setDateFrom("");
                setDateTo("");
              }}
              title="Limpar filtro"
            >
              <LucideIcon name="RotateCcw" size={14} />
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
                      {STATUS_CONFIG[a.status] && (
                        <LucideIcon name={STATUS_CONFIG[a.status]!.icon} size={14} />
                      )}
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
                    <LucideIcon name="Zap" size={14} /> {(a.consumption_kwh ?? 0).toFixed(0)} kWh
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    <LucideIcon name="DollarSign" size={14} /> R${" "}
                    {(a.estimated_monthly_cost ?? 0).toFixed(2)}
                  </span>
                </div>
                {a.highest_consumption_products && a.highest_consumption_products.length > 0 && (
                  <div className="dash-sim-products" style={{ marginTop: "0.25rem" }}>
                    <span className="dash-sim-products-label">Maiores consumidores:</span>
                    <span className="dash-sim-products-list">
                      {a.highest_consumption_products.map((product, i) => (
                        <span key={i} className="dash-sim-product-tag">
                          <LucideIcon
                            name={resolveApplianceIcon(product, "")}
                            size={12}
                            className="appliance-icon-inline"
                          />
                          {product}
                        </span>
                      ))}
                    </span>
                  </div>
                )}
              </div>
              <button
                className="history-item-delete"
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmDeleteId(a.id);
                }}
                title="Excluir análise"
              >
                <LucideIcon name="Trash2" size={16} />
              </button>
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

      {confirmDeleteId && (
        <div className="hist-modal-overlay" onClick={() => !deleting && setConfirmDeleteId(null)}>
          <div
            className="hist-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Confirmar exclusão de análise"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="hist-confirm-icon">
              <LucideIcon name="AlertTriangle" size={32} />
            </div>
            <h3>Excluir análise?</h3>
            <p>
              Esta ação não pode ser desfeita. A análise e todos os seus dados (recomendações,
              equipamentos) serão removidos permanentemente.
            </p>
            {deleteError && (
              <p style={{ color: "var(--state-error)", fontSize: "0.8rem", marginBottom: "1rem" }}>
                {deleteError}
              </p>
            )}
            <div className="hist-confirm-actions">
              <button
                className="dash-btn dash-btn--secondary"
                disabled={deleting}
                onClick={() => setConfirmDeleteId(null)}
              >
                Cancelar
              </button>
              <button
                className="hist-btn-delete-confirm"
                disabled={deleting}
                onClick={async () => {
                  if (!confirmDeleteId) return;
                  setDeleteError("");
                  setDeleting(true);
                  try {
                    await deleteAnalysis(confirmDeleteId);
                    setAnalyses((prev) => prev.filter((a) => a.id !== confirmDeleteId));
                    if (selectedId === confirmDeleteId) {
                      setSelectedId(null);
                      setDetail(null);
                    }
                    setConfirmDeleteId(null);
                  } catch {
                    setDeleteError("Erro ao excluir análise. Tente novamente.");
                  } finally {
                    setDeleting(false);
                  }
                }}
              >
                {deleting ? "Excluindo..." : "Sim, excluir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
