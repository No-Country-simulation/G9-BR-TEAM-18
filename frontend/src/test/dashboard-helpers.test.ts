import { describe, it, expect } from "vitest";
import type { AnalysisHistory } from "../types";
import { aggregateByGranularity, interpretTrend } from "../pages/dashboard/helpers";

function analysis(overrides: Partial<AnalysisHistory>): AnalysisHistory {
  return {
    id: "a",
    propertyId: 1,
    category: "BOM",
    probability: 0.8,
    consumption_kwh: 100,
    estimated_monthly_cost: 80,
    peak_hour_usage: false,
    high_consumption_hours: 4,
    created_at: "2026-07-20T10:00:00Z",
    recommendations: [],
    status: "CONCLUIDA",
    appliances: [],
    ...overrides,
  };
}

describe("aggregateByGranularity", () => {
  it("retorna [] para lista vazia", () => {
    expect(aggregateByGranularity([], "month")).toEqual([]);
  });

  it("ignora análises sem consumption_kwh", () => {
    const list = [analysis({ id: "a", consumption_kwh: null as unknown as number })];
    expect(aggregateByGranularity(list, "month")).toEqual([]);
  });

  it("agrega por mês somando os consumos (label pt-BR curto)", () => {
    const list = [
      analysis({ id: "a1", consumption_kwh: 100, created_at: "2026-07-01T10:00:00Z" }),
      analysis({ id: "a2", consumption_kwh: 50, created_at: "2026-07-15T10:00:00Z" }),
      analysis({ id: "a3", consumption_kwh: 200, created_at: "2026-08-01T10:00:00Z" }),
    ];
    const result = aggregateByGranularity(list, "month");
    expect(result).toHaveLength(2);
    expect(result[0].consumptionKwh).toBe(150);
    expect(result[1].consumptionKwh).toBe(200);
    // ordenado cronologicamente: julho antes de agosto
    expect(result[0].label.toLowerCase()).toContain("jul");
    expect(result[1].label.toLowerCase()).toContain("ago");
  });

  it("agrega por hora (0-23, horário local como no app)", () => {
    // Sem o sufixo Z, a data é interpretada no horário local (o app usa
    // date.getHours(), que reflete o fuso do navegador/CI)
    const list = [
      analysis({ id: "a1", consumption_kwh: 100, created_at: "2026-07-01T09:00:00" }),
      analysis({ id: "a2", consumption_kwh: 50, created_at: "2026-07-02T09:00:00" }),
    ];
    const result = aggregateByGranularity(list, "hour");
    expect(result).toEqual([{ label: "09h", consumptionKwh: 150 }]);
  });

  it("agrega por dia usando a data ISO como chave", () => {
    const list = [
      analysis({ id: "a1", consumption_kwh: 100, created_at: "2026-07-01T08:00:00Z" }),
      analysis({ id: "a2", consumption_kwh: 60, created_at: "2026-07-01T20:00:00Z" }),
      analysis({ id: "a3", consumption_kwh: 10, created_at: "2026-07-02T08:00:00Z" }),
    ];
    const result = aggregateByGranularity(list, "day");
    expect(result).toHaveLength(2);
    expect(result[0].consumptionKwh).toBe(160);
    expect(result[1].consumptionKwh).toBe(10);
  });
});

describe("interpretTrend", () => {
  it("retorna stable quando há menos de 2 análises válidas", () => {
    expect(interpretTrend([])).toEqual({ trend: "stable", percentage: 0 });
    expect(interpretTrend([analysis({ id: "a1" })])).toEqual({ trend: "stable", percentage: 0 });
  });

  it("retorna down quando o consumo caiu", () => {
    const list = [
      analysis({ id: "a1", consumption_kwh: 300, created_at: "2026-07-20T10:00:00Z" }),
      analysis({ id: "a2", consumption_kwh: 200, created_at: "2026-07-25T10:00:00Z" }),
    ];
    expect(interpretTrend(list).trend).toBe("down");
    expect(interpretTrend(list).percentage).toBeCloseTo(33.33, 0);
  });

  it("retorna up quando o consumo subiu", () => {
    const list = [
      analysis({ id: "a1", consumption_kwh: 200, created_at: "2026-07-20T10:00:00Z" }),
      analysis({ id: "a2", consumption_kwh: 300, created_at: "2026-07-25T10:00:00Z" }),
    ];
    expect(interpretTrend(list).trend).toBe("up");
    expect(interpretTrend(list).percentage).toBeCloseTo(50, 0);
  });

  it("retorna stable quando a variação é menor que 3%", () => {
    const list = [
      analysis({ id: "a1", consumption_kwh: 100 }),
      analysis({ id: "a2", consumption_kwh: 101 }),
    ];
    expect(interpretTrend(list)).toEqual({ trend: "stable", percentage: 0 });
  });

  it("com dados DESC (contrato real do GET /analyses) compara a mais recente com a anterior", () => {
    // O backend retorna OrderByCreatedAtDesc: mais recente primeiro.
    // a2 (25/07, 200 kWh) é mais recente que a1 (20/07, 300 kWh) -> consumo caiu.
    const list = [
      analysis({ id: "a2", consumption_kwh: 200, created_at: "2026-07-25T10:00:00Z" }),
      analysis({ id: "a1", consumption_kwh: 300, created_at: "2026-07-20T10:00:00Z" }),
    ];
    expect(interpretTrend(list).trend).toBe("down");
    expect(interpretTrend(list).percentage).toBeCloseTo(33.33, 0);
  });

  it("com dados fora de ordem (aleatórios) ordena pela data antes de comparar", () => {
    const list = [
      analysis({ id: "a2", consumption_kwh: 300, created_at: "2026-07-22T10:00:00Z" }),
      analysis({ id: "a3", consumption_kwh: 200, created_at: "2026-07-25T10:00:00Z" }),
      analysis({ id: "a1", consumption_kwh: 250, created_at: "2026-07-20T10:00:00Z" }),
    ];
    // mais recente = a3 (200), anterior = a2 (300) -> caiu 33%
    expect(interpretTrend(list).trend).toBe("down");
    expect(interpretTrend(list).percentage).toBeCloseTo(33.33, 0);
  });
});
