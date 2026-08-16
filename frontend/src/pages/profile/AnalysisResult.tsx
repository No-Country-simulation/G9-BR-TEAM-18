import type { AnalysisResponse } from "../../types";
import { CATEGORY_COLORS, CATEGORY_DISPLAY } from "../../types";
import { AnalysisSourceBadge } from "../../components/AnalysisSourceBadge";
import { resolveApplianceIcon } from "../../data/appliance-icons";
import { LucideIcon } from "../../components/LucideIcon";

export interface LastAnalysisInfo {
  category: string;
  probability: number;
  cost: number;
  date: string;
}

interface Props {
  analyzing: boolean;
  result: AnalysisResponse | null;
  lastAnalysis: LastAnalysisInfo | null;
  backendCategorySet: Set<string>;
  onViewHistory: () => void;
}

function ResultBadge({
  category,
  backendCategorySet,
}: {
  category: string;
  backendCategorySet: Set<string>;
}) {
  return (
    <div
      className="result-badge"
      style={{
        backgroundColor:
          CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] ??
          (backendCategorySet.has(category) ? "#818cf8" : "#9ca3af"),
      }}
    >
      {CATEGORY_DISPLAY[category as keyof typeof CATEGORY_DISPLAY] ?? category}
    </div>
  );
}

export function AnalysisResult({
  analyzing,
  result,
  lastAnalysis,
  backendCategorySet,
  onViewHistory,
}: Props) {
  return (
    <div className="profile-result">
      {analyzing && (
        <div className="result-placeholder">
          <div className="spinner" />
          <p>Analisando seu consumo...</p>
        </div>
      )}

      {result && !analyzing && (
        <div className="result-card">
          <ResultBadge category={result.category} backendCategorySet={backendCategorySet} />
          <AnalysisSourceBadge
            source={result.source}
            mlLabel="Análise por modelo de ML"
            fallbackLabel="Resultado por fallback"
            style={{ marginTop: "0.5rem" }}
          />
          <div className="result-stats">
            <div className="stat">
              <span className="stat-label">Confiança</span>
              <span className="stat-value">{(result.probability * 100).toFixed(0)}%</span>
            </div>
            <div className="stat">
              <span className="stat-label">Custo Estimado</span>
              <span className="stat-value">R$ {result.estimated_monthly_cost.toFixed(2)}</span>
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
          <ResultBadge category={lastAnalysis.category} backendCategorySet={backendCategorySet} />
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
            onClick={onViewHistory}
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
  );
}
