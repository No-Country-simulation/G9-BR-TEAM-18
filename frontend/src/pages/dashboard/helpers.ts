import type { AnalysisHistory } from "../../types";
import { sortAnalysesDesc } from "../../utils/analyses";

export type TimeGranularity = "month" | "day" | "hour";

export const GRANULARITY_OPTIONS: {
  value: TimeGranularity;
  label: string;
  icon: string;
}[] = [
  { value: "month", label: "Mensal", icon: "Calendar" },
  { value: "day", label: "Diário", icon: "History" },
  { value: "hour", label: "Por hora", icon: "Clock" },
];

interface GranularityEntry {
  sortKey: number | string;
  label: string;
  consumptionKwh: number;
}

export function aggregateByGranularity(
  analyses: AnalysisHistory[],
  granularity: TimeGranularity,
): { label: string; consumptionKwh: number }[] {
  const map = new Map<string | number, number>();
  const labelMap = new Map<string | number, string>();

  for (const a of analyses) {
    if (a.consumption_kwh == null) continue;
    const date = new Date(a.created_at);
    let sortKey: string | number;
    let label: string;

    switch (granularity) {
      case "month": {
        sortKey = date.getFullYear() * 12 + date.getMonth();
        label = date.toLocaleDateString("pt-BR", {
          month: "short",
          year: "numeric",
        });
        break;
      }
      case "day": {
        sortKey = date.toISOString().slice(0, 10);
        label = date.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "short",
        });
        break;
      }
      case "hour": {
        sortKey = date.getHours();
        label = `${String(date.getHours()).padStart(2, "0")}h`;
        break;
      }
    }

    map.set(sortKey, (map.get(sortKey) ?? 0) + a.consumption_kwh);
    labelMap.set(sortKey, label);
  }

  const entries: GranularityEntry[] = Array.from(map.entries())
    .map(([sortKey, consumptionKwh]) => ({
      sortKey,
      label: labelMap.get(sortKey) ?? String(sortKey),
      consumptionKwh,
    }))
    .sort((a, b) => {
      if (typeof a.sortKey === "number" && typeof b.sortKey === "number") {
        return a.sortKey - b.sortKey;
      }
      return String(a.sortKey).localeCompare(String(b.sortKey));
    });

  return entries.map(({ label, consumptionKwh }) => ({ label, consumptionKwh }));
}

export const CATEGORY_RANK: Record<string, number> = {
  EXCELENTE: 0,
  BOM: 1,
  MEDIANO: 2,
  RUIM: 3,
  CRITICO: 4,
};

export interface TrendInfo {
  trend: "up" | "down" | "stable";
  percentage: number;
}

export function interpretTrend(analyses: AnalysisHistory[]): TrendInfo {
  const valid = analyses.filter((a) => a.consumption_kwh != null);
  if (valid.length < 2) return { trend: "stable", percentage: 0 };
  // GET /analyses retorna DESC; ordena para comparar a mais recente com a anterior
  const sorted = sortAnalysesDesc(valid);
  const latest = sorted[0];
  const prev = sorted[1];
  const diff = latest.consumption_kwh - prev.consumption_kwh;
  const pct = prev.consumption_kwh > 0 ? (diff / prev.consumption_kwh) * 100 : 0;
  if (Math.abs(pct) < 3) return { trend: "stable", percentage: 0 };
  return { trend: pct > 0 ? "up" : "down", percentage: Math.abs(pct) };
}
