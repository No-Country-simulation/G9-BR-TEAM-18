import { describe, it, expect, vi, beforeEach } from "vitest";
import { analyzeEnergy, listAnalyses, fetchDashboard } from "../../services/api";
import { API_URL, mockFetch, mockResponse } from "./helpers";

describe("analyzeEnergy", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sends authenticated POST and returns response", async () => {
    const data = {
      category: "BOM",
      probability: 0.85,
      recommendations: [],
      estimated_monthly_cost: 75,
    };
    mockFetch.mockResolvedValueOnce(mockResponse(true, data));

    const result = await analyzeEnergy(1, 100, false, 2);

    expect(result).toEqual(data);
  });

  it("throws ApiError on validation error", async () => {
    const errorBody = {
      message: "validation failed",
      fields: { consumption_kwh: "must be positive" },
    };
    mockFetch.mockResolvedValueOnce(mockResponse(false, errorBody));

    await expect(analyzeEnergy(1, -1, false, 2)).rejects.toThrow("validation failed");
  });

  it("uses default message when server does not return message", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(false, { fields: {} }));

    await expect(analyzeEnergy(1, 200, false, 4)).rejects.toThrow("Erro ao analisar consumo");
  });

  it("sends peak_hour_usage and high_consumption_hours in the request body (F069)", async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse(true, {
        category: "BOM",
        probability: 0.85,
        recommendations: [],
        estimated_monthly_cost: 150,
      }),
    );

    await analyzeEnergy(1, 200, false, 4);

    expect(mockFetch).toHaveBeenCalledWith(
      `${API_URL}/energy-analysis`,
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          property_id: 1,
          consumption_kwh: 200,
          peak_hour_usage: false,
          high_consumption_hours: 4,
        }),
      }),
    );
  });
});

describe("listAnalyses", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns empty array when response is not ok", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(false, []));

    const result = await listAnalyses();
    expect(result).toEqual([]);
  });

  it("mapeia updated_at, source e highest_consumption_products (F073)", async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse(true, [
        {
          id: "a1",
          property_id: 10,
          category: "BOM",
          probability: 0.78,
          consumption_kwh: 280,
          estimated_monthly_cost: 210,
          peak_hour_usage: false,
          high_consumption_hours: 4,
          created_at: "2026-07-22T14:30:00Z",
          updated_at: "2026-07-23T09:00:00Z",
          source: "model",
          recommendations: [],
          status: "CONCLUIDA",
          highest_consumption_products: ["Ar Condicionado", "Geladeira"],
        },
      ]),
    );

    const result = await listAnalyses();
    expect(result[0].updated_at).toBe("2026-07-23T09:00:00Z");
    expect(result[0].source).toBe("model");
    expect(result[0].highest_consumption_products).toEqual(["Ar Condicionado", "Geladeira"]);
  });

  it("deixa updated_at e source undefined quando o backend nao retorna (contrato anterior)", async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse(true, [
        {
          id: "a1",
          property_id: 10,
          category: "BOM",
          probability: 0.78,
          consumption_kwh: 280,
          estimated_monthly_cost: 210,
          peak_hour_usage: false,
          high_consumption_hours: 4,
          created_at: "2026-07-22T14:30:00Z",
          recommendations: [],
          status: "CONCLUIDA",
        },
      ]),
    );

    const result = await listAnalyses();
    expect(result[0].updated_at).toBeUndefined();
    expect(result[0].source).toBeUndefined();
    expect(result[0].highest_consumption_products).toBeUndefined();
  });
});

describe("fetchDashboard", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns zeroed data when response is not ok", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(false, {}));

    const result = await fetchDashboard();
    expect(result).toEqual({
      totalAnalyses: 0,
      averageConsumptionKwh: 0,
      totalEstimatedCost: 0,
      totalCo2EmissionKg: 0,
      monthlyConsumption: [],
    });
  });
});
