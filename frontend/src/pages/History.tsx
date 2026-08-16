import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/useAuth";
import { listAnalyses, fetchAnalysisById, deleteAnalysis } from "../services/api";
import type { AnalysisHistory } from "../types";
import { CATEGORY_DISPLAY } from "../types";
import { resolveApplianceIcon } from "../data/appliance-icons";
import { LucideIcon } from "../components/LucideIcon";
import { AnalysisDetail } from "./history/AnalysisDetail";
import { DeleteConfirmModal } from "./history/DeleteConfirmModal";
import { StatusBadge } from "./history/status";
import { badgeStyle } from "./history/statusConfig";

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

  // Fecha o modal de confirmação com Escape e gerencia foco/trap/inert
  // dentro do DeleteConfirmModal (só montado quando confirmDeleteId existe).

  const handleConfirmDelete = async () => {
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
  };

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
                  <StatusBadge status={a.status} />
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
        <DeleteConfirmModal
          deleting={deleting}
          error={deleteError}
          onCancel={() => setConfirmDeleteId(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
}
