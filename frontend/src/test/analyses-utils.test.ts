import { describe, it, expect } from "vitest";
import type { AnalysisHistory } from "../types";
import { sortAnalysesDesc, latestAnalysis } from "../utils/analyses";

function analysis(id: string, created_at: string): AnalysisHistory {
  return {
    id,
    propertyId: 1,
    category: "BOM",
    probability: 0.8,
    consumption_kwh: 100,
    estimated_monthly_cost: 80,
    peak_hour_usage: false,
    high_consumption_hours: 4,
    created_at,
    recommendations: [],
    status: "CONCLUIDA",
    appliances: [],
  };
}

describe("sortAnalysesDesc", () => {
  it("retorna [] para lista vazia", () => {
    expect(sortAnalysesDesc([])).toEqual([]);
  });

  it("não muta o array original", () => {
    const list = [analysis("a1", "2026-07-20T10:00:00Z"), analysis("a2", "2026-07-25T10:00:00Z")];
    sortAnalysesDesc(list);
    expect(list[0].id).toBe("a1");
  });

  it("ordena da mais recente para a mais antiga (contrato DESC do backend)", () => {
    const list = [
      analysis("a1", "2026-07-20T10:00:00Z"),
      analysis("a2", "2026-07-22T14:30:00Z"),
      analysis("a3", "2026-07-25T09:15:00Z"),
    ];
    expect(sortAnalysesDesc(list).map((a) => a.id)).toEqual(["a3", "a2", "a1"]);
  });

  it("funciona mesmo se a entrada já vier DESC ou fora de ordem", () => {
    const desc = [
      analysis("a3", "2026-07-25T09:15:00Z"),
      analysis("a2", "2026-07-22T14:30:00Z"),
      analysis("a1", "2026-07-20T10:00:00Z"),
    ];
    const shuffled = [desc[1], desc[2], desc[0]];
    expect(sortAnalysesDesc(desc).map((a) => a.id)).toEqual(["a3", "a2", "a1"]);
    expect(sortAnalysesDesc(shuffled).map((a) => a.id)).toEqual(["a3", "a2", "a1"]);
  });
});

describe("latestAnalysis", () => {
  it("retorna undefined para lista vazia", () => {
    expect(latestAnalysis([])).toBeUndefined();
  });

  it("retorna a análise mais recente independente da ordem do array", () => {
    const asc = [
      analysis("a1", "2026-07-20T10:00:00Z"),
      analysis("a2", "2026-07-22T14:30:00Z"),
      analysis("a3", "2026-07-25T09:15:00Z"),
    ];
    const desc = [...asc].reverse();
    const shuffled = [asc[1], asc[2], asc[0]];
    expect(latestAnalysis(asc)?.id).toBe("a3");
    expect(latestAnalysis(desc)?.id).toBe("a3");
    expect(latestAnalysis(shuffled)?.id).toBe("a3");
  });
});
