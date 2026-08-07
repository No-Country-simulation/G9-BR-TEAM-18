import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchContractInfo, listAppliances } from "../../services/api";
import { mockFetch, mockResponse } from "./helpers";

describe("fetchContractInfo", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns mapped contract info on success", async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse(true, {
        property_types: ["RESIDENCIAL", "APARTAMENTO", "COMERCIAL"],
        consumption_categories: ["REFRIGERATION", "LIGHTING"],
        efficiency_categories: ["EXCELENTE", "BOM"],
      }),
    );

    const result = await fetchContractInfo();
    expect(result).toEqual({
      propertyTypes: ["RESIDENCIAL", "APARTAMENTO", "COMERCIAL"],
      consumptionCategories: ["REFRIGERATION", "LIGHTING"],
      efficiencyCategories: ["EXCELENTE", "BOM"],
    });
  });

  it("returns empty defaults when response is not ok", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(false, {}));

    const result = await fetchContractInfo();
    expect(result).toEqual({
      propertyTypes: [],
      consumptionCategories: [],
      efficiencyCategories: [],
    });
  });

  it("returns empty defaults on network error (never throws)", async () => {
    mockFetch.mockRejectedValueOnce(new Error("network"));

    const result = await fetchContractInfo();
    expect(result).toEqual({
      propertyTypes: [],
      consumptionCategories: [],
      efficiencyCategories: [],
    });
  });

  it("handles missing/invalid array fields gracefully", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(true, { property_types: null }));

    const result = await fetchContractInfo();
    expect(result.propertyTypes).toEqual([]);
    expect(result.consumptionCategories).toEqual([]);
  });
});

describe("listAppliances", () => {
  beforeEach(() => vi.clearAllMocks());

  it("throws on network error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("network"));

    await expect(listAppliances()).rejects.toThrow();
  });

  it("throws when response is not ok", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(false, { message: "API error" }));

    await expect(listAppliances()).rejects.toThrow("API error");
  });

  it("returns enriched appliances on success (contrato ADR-0027 + id B052)", async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse(true, [
        {
          id: 1,
          name: "Geladeira",
          ml_category: "REFRIGERATION",
          watts: 150,
          hours: 24,
        },
      ]),
    );

    const result = await listAppliances();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
    expect(result[0].name).toBe("Geladeira");
    expect(result[0].icon).toBe("Refrigerator");
    expect(result[0].powerWatts).toBe(150);
    expect(result[0].dailyUsageHours).toBe(24);
  });

  it("preserva id real do backend em Number() para o batch update (B052)", async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse(true, [
        { id: 3, name: "Televisao", ml_category: "TECHNOLOGY", watts: 120, hours: 5 },
      ]),
    );

    const result = await listAppliances();
    expect(Number(result[0].id)).toBe(3);
    expect(Number.isNaN(Number(result[0].id))).toBe(false);
  });
});
