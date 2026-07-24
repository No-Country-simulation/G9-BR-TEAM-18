import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import * as I from "lucide-react";
import type { AnalysisResponse, PropertyAppliance } from "../types";
import { ApiError, CATEGORY_COLORS, CATEGORY_DISPLAY } from "../types";
import { listProperties, listPropertyAppliances, analyzeEnergy } from "../services/api";
import type { PropertyResponse } from "../services/api";

export default function AnalysisPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [property, setProperty] = useState<PropertyResponse | null>(null);
  const [appliances, setAppliances] = useState<PropertyAppliance[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    listProperties()
      .then((props) => {
        const active = props.find((p) => p.active) ?? props[0] ?? null;
        if (active) {
          setProperty(active);
          return listPropertyAppliances(active.id).then(setAppliances);
        }
      })
      .finally(() => setLoading(false));
  }, [user, navigate]);

  async function handleAnalyze() {
    if (!property) return;
    setAnalyzing(true);
    setError(null);
    setResult(null);
    try {
      const totalConsumo =
        appliances.length > 0
          ? appliances.reduce((sum, a) => sum + Number(a.estimated_monthly_consumption_kwh ?? 0), 0)
          : 300;
      const res = await analyzeEnergy(property.id, totalConsumo, false, 6);
      setResult(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro na análise");
    } finally {
      setAnalyzing(false);
    }
  }

  if (loading) {
    return (
      <div className="dash-page" style={{ display: "flex", justifyContent: "center" }}>
        <p>Carregando...</p>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="dash-page" style={{ textAlign: "center" }}>
        <I.BarChart3 size={48} style={{ opacity: 0.4, marginBottom: "1rem" }} />
        <h2 style={{ marginBottom: "0.5rem" }}>Nenhum perfil encontrado</h2>
        <p style={{ marginBottom: "1.5rem", color: "var(--text-muted)" }}>
          Crie seu perfil com tipo de imóvel e aparelhos antes de fazer uma análise.
        </p>
        <button onClick={() => navigate("/profile")} className="btn btn-primary">
          <I.UserCog size={18} /> Criar Perfil
        </button>
      </div>
    );
  }

  const totalKwh = appliances.reduce(
    (sum, a) => sum + Number(a.estimated_monthly_consumption_kwh ?? 0),
    0,
  );
  const totalQty = appliances.reduce((sum, a) => sum + a.quantity, 0);

  return (
    <div className="analysis-auto-page">
      <div className="analysis-auto-container">
        <div className="analysis-auto-header">
          <I.BarChart3 size={28} />
          <h1>Análise Automática</h1>
          <p>Use os dados do seu perfil para analisar o consumo energético.</p>
        </div>

        {error && (
          <div className="profile-error">
            <I.AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="profile-grid">
          <div className="analysis-auto-summary">
            <h3 className="section-title">Resumo do Perfil</h3>

            <div className="summary-card">
              <div className="summary-row">
                <I.Home size={18} />
                <span>
                  <strong>Tipo:</strong> {property.property_type}
                </span>
              </div>
              <div className="summary-row">
                <I.Box size={18} />
                <span>
                  <strong>Aparelhos:</strong> {totalQty} equipamentos
                </span>
              </div>
              <div className="summary-row">
                <I.Zap size={18} />
                <span>
                  <strong>Consumo:</strong> {totalKwh.toFixed(0)} kWh/mês
                </span>
              </div>
            </div>

            <div className="appliance-mini-list">
              <h4>Aparelhos ({appliances.length})</h4>
              {appliances.length === 0 ? (
                <p className="appliance-empty-hint">
                  Nenhum aparelho cadastrado. Adicione no perfil para maior precisão.
                </p>
              ) : (
                appliances.map((a) => (
                  <div key={a.id} className="appliance-mini-item">
                    <span className="appliance-mini-name">{a.appliance_name}</span>
                    <span className="appliance-mini-qty">{a.quantity}x</span>
                    <span className="appliance-mini-kwh">
                      {Number(a.estimated_monthly_consumption_kwh ?? 0).toFixed(0)} kWh
                    </span>
                  </div>
                ))
              )}
            </div>

            <button
              type="button"
              className="btn btn-primary btn-full"
              onClick={handleAnalyze}
              disabled={analyzing}
            >
              {analyzing ? (
                "Analisando..."
              ) : (
                <>
                  <I.BarChart3 size={18} /> Analisar Agora
                </>
              )}
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-full"
              onClick={() => navigate("/profile")}
              style={{ marginTop: "0.5rem" }}
            >
              <I.UserCog size={18} /> Editar Perfil
            </button>
          </div>

          <div className="profile-result">
            {analyzing && (
              <div className="result-placeholder">
                <div className="spinner" />
                <p>Analisando...</p>
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

            {!result && !analyzing && (
              <div className="result-placeholder">
                <I.BarChart3 size={48} className="placeholder-icon" />
                <p>Clique em "Analisar Agora" para ver o resultado.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
