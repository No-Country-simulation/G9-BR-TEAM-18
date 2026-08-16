import type { CSSProperties } from "react";
import { CATEGORY_COLORS } from "../../types";

export const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: string } | undefined
> = {
  CONCLUIDA: { label: "Concluída", color: "#10b981", icon: "CheckCircle" },
  PENDENTE: { label: "Pendente", color: "#f59e0b", icon: "Clock" },
  FALHA: { label: "Falha", color: "#ef4444", icon: "AlertCircle" },
};

export function badgeStyle(cat: string): CSSProperties {
  const bg = CATEGORY_COLORS[cat as keyof typeof CATEGORY_COLORS] ?? "#ef4444";
  return { background: bg };
}
