import type { CSSProperties } from "react";
import { LucideIcon } from "../../components/LucideIcon";
import { STATUS_CONFIG } from "./statusConfig";

const STATUS_BADGE_STYLE: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.25rem",
  padding: "0.15rem 0.5rem",
  borderRadius: "999px",
  fontSize: "0.75rem",
  fontWeight: 600,
  color: "#fff",
  whiteSpace: "nowrap",
};

/**
 * Badge de status de análise (exibido na lista e no modal de detalhe).
 * Retorna null para análises concluídas (sem badge) ou sem status.
 */
export function StatusBadge({ status }: { status?: string | null }) {
  if (!status || status === "CONCLUIDA") return null;
  const config = STATUS_CONFIG[status];
  return (
    <span
      className="history-item-status"
      style={{ ...STATUS_BADGE_STYLE, background: config?.color ?? "#6b7280" }}
    >
      {config && <LucideIcon name={config.icon} size={14} />}
      {config?.label ?? status}
    </span>
  );
}
