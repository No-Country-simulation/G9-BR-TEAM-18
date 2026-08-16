import { useRef } from "react";
import type { AnalysisHistory } from "../../types";
import { CATEGORY_DISPLAY } from "../../types";
import { LucideIcon } from "../../components/LucideIcon";
import { AnalysisSourceBadge } from "../../components/AnalysisSourceBadge";
import { useDialogFocus } from "../../hooks/useDialogFocus";
import { useEscapeKey } from "../../hooks/useEscapeKey";
import { useFocusTrap } from "../../hooks/useFocusTrap";
import { useInertBackground } from "../../hooks/useInertBackground";
import { ApplianceChart, ApplianceTable } from "./ApplianceBreakdown";
import { StatusBadge } from "./status";
import { badgeStyle } from "./statusConfig";

interface Props {
  analysis: AnalysisHistory;
  onClose: () => void;
}

export function AnalysisDetail({ analysis, onClose }: Props) {
  // Fecha o modal de detalhe com a tecla Escape (acessibilidade).
  // O componente só é renderizado enquanto o modal está aberto, então o hook
  // fica ativo desde a montagem e é limpo no desmonte (fechar).
  useEscapeKey(onClose);

  // Foco no botão de fechar ao abrir o modal; restaura ao desmontar (a11y).
  // Este componente só é renderizado enquanto o modal está aberto (ver
  // `{detail && !loadingDetail && <AnalysisDetail ... />}`), então o estado
  // `open` é sempre `true` — o cleanup do hook roda no desmonte (fechar).
  const closeRef = useRef<HTMLButtonElement>(null);
  useDialogFocus(true, closeRef);

  // Confina a navegação por Tab dentro do diálogo (ARIA APG)
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef);
  // Isola o conteúdo de fundo do leitor de tela e do foco enquanto aberto (ARIA APG)
  useInertBackground(dialogRef);

  return (
    <div className="hist-modal-overlay" onClick={onClose}>
      <div
        ref={dialogRef}
        className="hist-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Detalhes da análise"
        onClick={(e) => e.stopPropagation()}
      >
        <button ref={closeRef} className="hist-modal-close" onClick={onClose}>
          <LucideIcon name="X" size={20} />
        </button>

        <div className="hist-modal-header">
          <span className="history-item-cat" style={badgeStyle(analysis.category)}>
            {CATEGORY_DISPLAY[analysis.category] ?? analysis.category}
          </span>
          <StatusBadge status={analysis.status} />
          <AnalysisSourceBadge source={analysis.source} />
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
