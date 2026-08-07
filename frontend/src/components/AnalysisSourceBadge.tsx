import type { CSSProperties } from "react";
import { LucideIcon } from "./LucideIcon";
import { resolveAnalysisSource } from "../types";

interface AnalysisSourceBadgeProps {
  /** Campo `source` do contrato (model, model+groq, rule-based, ML, FALLBACK…) */
  source?: string;
  /** Rótulo quando a fonte é o modelo treinado (padrão: "Modelo ML") */
  mlLabel?: string;
  /** Rótulo quando a fonte é fallback por regras (padrão: "Fallback") */
  fallbackLabel?: string;
  style?: CSSProperties;
}

/**
 * Badge que indica a fonte da análise ("Modelo ML" vs "Fallback").
 *
 * Normaliza o campo `source` via `resolveAnalysisSource` (os valores reais do
 * contrato são `model`, `model+groq (confidence …)` e `rule-based (…)` — a
 * comparação antiga `source === "ML"` exibia "Fallback" para toda análise).
 * Não renderiza nada quando o source é ausente/desconhecido.
 */
export function AnalysisSourceBadge({
  source,
  mlLabel = "Modelo ML",
  fallbackLabel = "Fallback",
  style,
}: AnalysisSourceBadgeProps) {
  const kind = resolveAnalysisSource(source);
  if (!kind) return null;
  const isMl = kind === "ml";
  return (
    <span className="analysis-source-badge" style={style}>
      <LucideIcon name={isMl ? "Sparkles" : "AlertTriangle"} size={12} />
      {isMl ? mlLabel : fallbackLabel}
    </span>
  );
}
