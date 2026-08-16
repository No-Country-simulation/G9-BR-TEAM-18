import { ArrowUp, ArrowDown, TrendingUp } from "lucide-react";
import type { AnalysisHistory } from "../../types";
import { CATEGORY_COLORS, CATEGORY_DISPLAY } from "../../types";
import type { TrendInfo } from "./helpers";

interface Props {
  lastAnalysis: AnalysisHistory;
  trendInfo: TrendInfo;
  rankDiff: number;
  recentCategories: string[];
  backendCategorySet: Set<string>;
}

export function LastAnalysisSection({
  lastAnalysis,
  trendInfo,
  rankDiff,
  recentCategories,
  backendCategorySet,
}: Props) {
  return (
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
      {rankDiff !== 0 && recentCategories.length >= 2 && (
        <div className={`dash-progress-msg ${rankDiff > 0 ? "dash-progress-msg--worse" : ""}`}>
          {rankDiff < 0 ? <TrendingUp size={16} /> : <ArrowDown size={16} />}
          {rankDiff < 0 ? "Você evoluiu de " : "Seu consumo piorou de "}
          <strong>
            {CATEGORY_DISPLAY[recentCategories[1] as keyof typeof CATEGORY_DISPLAY] ??
              recentCategories[1]}
          </strong>{" "}
          para{" "}
          <strong>
            {CATEGORY_DISPLAY[recentCategories[0] as keyof typeof CATEGORY_DISPLAY] ??
              recentCategories[0]}
          </strong>
          !
        </div>
      )}
    </div>
  );
}
