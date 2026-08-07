import { describe, it, expect } from "vitest";
import type { ApplianceType, ApplianceItem } from "../types";
import { computeApplianceCalc } from "../pages/profile/applianceCalc";

const CATALOG: ApplianceType[] = [
  {
    id: "1",
    name: "Geladeira",
    mlCategory: "REFRIGERATION",
    powerWatts: 150,
    dailyUsageHours: 24,
    icon: "Refrigerator",
  },
  {
    id: "2",
    name: "Ar Condicionado",
    mlCategory: "CLIMATE_CONTROL",
    powerWatts: 1400,
    dailyUsageHours: 8,
    icon: "AirVent",
  },
  {
    id: "3",
    name: "Lampada LED",
    mlCategory: "LIGHTING",
    powerWatts: 10,
    dailyUsageHours: 6,
    icon: "Lightbulb",
  },
];

describe("computeApplianceCalc", () => {
  it("retorna zeros quando não há aparelhos selecionados", () => {
    expect(computeApplianceCalc([], CATALOG)).toEqual({
      totalEquipment: 0,
      monthlyConsumptionKwh: 0,
      highestConsumptionCategory: undefined,
      highestConsumptionProducts: [],
    });
  });

  it("calcula consumo mensal e total de equipamentos", () => {
    const items: ApplianceItem[] = [
      { type: "1", quantity: 1 }, // 150W * 24h = 3.6 kWh/dia -> 108 kWh/mês
      { type: "2", quantity: 2 }, // 1400W * 8h * 2 = 22.4 kWh/dia -> 672 kWh/mês
    ];
    const result = computeApplianceCalc(items, CATALOG);
    expect(result.totalEquipment).toBe(3);
    expect(result.monthlyConsumptionKwh).toBeCloseTo(780, 0);
    // Maior potência agregada: CLIMATE_CONTROL (1400*2 = 2800W) > REFRIGERATION (150W)
    expect(result.highestConsumptionCategory).toBe("CLIMATE_CONTROL");
  });

  it("listas os 3 maiores consumidores em kWh/mês ordenados", () => {
    const items: ApplianceItem[] = [
      { type: "3", quantity: 1 }, // 10W * 6h = 60Wh -> 1.8 kWh/mês
      { type: "1", quantity: 1 }, // 108 kWh/mês
      { type: "2", quantity: 1 }, // 336 kWh/mês
    ];
    const result = computeApplianceCalc(items, CATALOG);
    expect(result.highestConsumptionProducts).toEqual([
      "Ar Condicionado",
      "Geladeira",
      "Lampada LED",
    ]);
  });

  it("ignora aparelhos selecionados que não existem no catálogo", () => {
    const items: ApplianceItem[] = [
      { type: "999", quantity: 5 },
      { type: "1", quantity: 1 },
    ];
    const result = computeApplianceCalc(items, CATALOG);
    expect(result.totalEquipment).toBe(1);
    expect(result.monthlyConsumptionKwh).toBeCloseTo(108, 0);
  });
});
