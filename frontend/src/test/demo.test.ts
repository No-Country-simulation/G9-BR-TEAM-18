import { describe, it, expect, vi, beforeEach } from "vitest";
import { analyzeEnergy } from "../services/api";

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

const API_URL = "http://localhost:8080";

describe("analyzeEnergy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns AnalysisResponse on success", async () => {
    const responseData = {
      category: "BOM",
      probability: 0.85,
      recommendations: ["Mantenha o bom acompanhamento"],
      estimated_monthly_cost: 150,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(responseData),
    });

    const result = await analyzeEnergy(1, 200, false, 4);

    expect(mockFetch).toHaveBeenCalledWith(`${API_URL}/energy-analysis`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        property_id: 1,
        consumption_kwh: 200,
        peak_hour_usage: false,
        high_consumption_hours: 4,
      }),
      credentials: "include",
    });

    expect(result).toEqual(responseData);
  });

  it("throws ApiError on 400 error", async () => {
    const errorBody = {
      message: "Erro de validação",
      fields: { consumption_kwh: "deve ser positivo" },
    };

    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve(errorBody),
    });

    await expect(analyzeEnergy(1, 200, false, 4)).rejects.toThrow("Erro de validação");
  });

  it("uses default message when server does not return message", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ fields: {} }),
    });

    await expect(analyzeEnergy(1, 200, false, 4)).rejects.toThrow("Erro ao analisar consumo");
  });

  it("makes request with credentials include", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ category: "EFICIENTE" }),
    });

    await analyzeEnergy(1, 100, true, 6);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/energy-analysis"),
      expect.objectContaining({ method: "POST", credentials: "include" }),
    );
  });
});
