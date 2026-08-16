import { describe, it, expect } from "vitest";
import {
  getCategoryDisplay,
  resolveApplianceIcon,
  sortCategories,
} from "../../data/appliance-icons";
import { enrichAppliance } from "../../data/appliances";

/* =========================================================================
 * Integração: fluxo completo de enrichAppliance (via appliances.ts)
 * Verifica se a integração entre enrichAppliance e resolveApplianceIcon
 * funciona corretamente com os valores do backend (ADR-0027).
 * ========================================================================= */

describe("enrichAppliance (integração)", () => {
  it("mapeia o contrato novo (ADR-0027): ml_category, watts, hours", () => {
    const raw = {
      id: 1,
      name: "Geladeira",
      ml_category: "REFRIGERATION",
      watts: 150,
      hours: 24,
    };
    const result = enrichAppliance(raw);
    expect(result.name).toBe("Geladeira");
    expect(result.id).toBe("1");
    expect(result.mlCategory).toBe("REFRIGERATION");
    expect(result.powerWatts).toBe(150);
    expect(result.dailyUsageHours).toBe(24);
    expect(result.icon).toBe("Refrigerator");
  });

  it("usa o id real do backend quando presente (B052)", () => {
    const raw = {
      id: 7,
      name: "Micro-ondas",
      ml_category: "APPLIANCES",
      watts: 800,
      hours: 1,
    };
    const result = enrichAppliance(raw);
    expect(result.id).toBe("7");
    expect(Number.isNaN(Number(result.id))).toBe(false);
  });

  it("gera id estável a partir do nome quando o contrato não expõe id", () => {
    const raw = {
      name: "Televisão OLED",
      ml_category: "TECHNOLOGY",
      watts: 200,
      hours: 6,
    };
    const result = enrichAppliance(raw);
    expect(result.id).toBe("televisao-oled");
    expect(result.mlCategory).toBe("TECHNOLOGY");
    expect(result.powerWatts).toBe(200);
    expect(result.dailyUsageHours).toBe(6);
  });

  it("enriquece com ícone correto para climatizacao (contrato novo)", () => {
    const raw = {
      name: "Ar Condicionado",
      ml_category: "CLIMATE_CONTROL",
      watts: 1400,
      hours: 8,
    };
    const result = enrichAppliance(raw);
    expect(result.icon).toBe("AirVent");
  });

  it("enriquece aparelho desconhecido com fallback por categoria", () => {
    const raw = {
      name: "Aparelho Desconhecido XYZ",
      ml_category: "TECHNOLOGY",
      watts: 100,
      hours: 5,
    };
    const result = enrichAppliance(raw);
    expect(result.icon).toBe("Monitor");
  });

  it("mantém compatibilidade com o contrato antigo (appliance_category)", () => {
    const raw = {
      id: 42,
      name: "Televisao OLED",
      appliance_category: "TECHNOLOGY",
      average_power_watts: 200,
      average_daily_use_hours: 6,
    };
    const result = enrichAppliance(raw);
    expect(result.id).toBe("42");
    expect(result.mlCategory).toBe("TECHNOLOGY");
    expect(result.powerWatts).toBe(200);
    expect(result.dailyUsageHours).toBe(6);
  });

  it("categoria ausente → fallback OTHERS sem crash", () => {
    const raw = { name: "Aparelho Sem Categoria", watts: 100, hours: 4 };
    const result = enrichAppliance(raw);
    expect(result.mlCategory).toBe("OTHERS");
    expect(result.icon).toBe("HelpCircle");
    expect(result.powerWatts).toBe(100);
  });
});

/* =========================================================================
 * Proteção contra payloads inesperados (undefined/null) — F062
 * ========================================================================= */
describe("proteção contra undefined/null", () => {
  it("getCategoryDisplay(undefined) → fallback 'Outros' sem crash", () => {
    const d = getCategoryDisplay(undefined as unknown as string);
    expect(d.label).toBe("Outros");
    expect(d.icon).toBe("HelpCircle");
    expect(d.color).toBe("#6b7280");
  });

  it("getCategoryDisplay(null) → fallback 'Outros' sem crash", () => {
    const d = getCategoryDisplay(null as unknown as string);
    expect(d.label).toBe("Outros");
  });

  it("getCategoryDisplay('') → fallback 'Outros' sem crash", () => {
    const d = getCategoryDisplay("");
    expect(d.label).toBe("Outros");
  });

  it("sortCategories ignora undefined/null/vazios sem crash", () => {
    const result = sortCategories([
      "LIGHTING",
      undefined as unknown as string,
      "REFRIGERATION",
      "",
      null as unknown as string,
    ]);
    expect(result).toEqual(["REFRIGERATION", "LIGHTING"]);
  });

  it("resolveApplianceIcon com name undefined → HelpCircle sem crash", () => {
    expect(resolveApplianceIcon(undefined as unknown as string, "REFRIGERATION")).toBe(
      "Refrigerator",
    );
    expect(resolveApplianceIcon(undefined as unknown as string)).toBe("HelpCircle");
  });
});
