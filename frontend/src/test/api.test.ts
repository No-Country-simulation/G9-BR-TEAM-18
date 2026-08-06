import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  analyzeEnergy,
  login,
  register,
  listAnalyses,
  fetchDashboard,
  fetchContractInfo,
  createProperty,
  listProperties,
  updateProperty,
  deleteProperty,
  listPropertyAppliances,
  listAppliances,
  fetchPreferences,
  updatePreferences,
} from "../services/api";

const API_URL = "http://localhost:8080";
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

function mockResponse(ok: boolean, data: unknown) {
  return { ok, json: () => Promise.resolve(data), headers: new Headers() } as Response;
}

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

describe("login", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sends POST to /auth/login", async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse(true, { id: "1", name: "Teste", email: "test@test.com" }),
    );

    await login("test@test.com", "123456");

    expect(mockFetch).toHaveBeenCalledWith(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email: "test@test.com", password: "123456" }),
    });
  });

  it("throws error when login fails", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(false, { message: "Credenciais inválidas" }));

    await expect(login("x@x.com", "wrong")).rejects.toThrow("Credenciais inválidas");
  });

  it("uses default message when server does not return message", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(false, {}));

    await expect(login("x@x.com", "wrong")).rejects.toThrow("Erro ao fazer login");
  });
});

describe("register", () => {
  beforeEach(() => vi.clearAllMocks());

  it("throws error when registration fails", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(false, { message: "Email já existe" }));

    await expect(register("A", "a@a.com", "123")).rejects.toThrow("Email já existe");
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

describe("createProperty", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sends POST to /properties and returns property", async () => {
    const data = { id: 1, alias: "Casa", property_type: "Casa", active: true };
    mockFetch.mockResolvedValueOnce(mockResponse(true, data));

    const result = await createProperty("Casa", "Casa");

    expect(result).toEqual(data);
    expect(mockFetch).toHaveBeenCalledWith(`${API_URL}/properties`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        alias: "Casa",
        property_type: "Casa",
        address: null,
        resident_count: null,
        area_sqm: null,
      }),
    });
  });

  it("throws ApiError on failure", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(false, { message: "erro" }));

    await expect(createProperty("Casa", "Casa")).rejects.toThrow("erro");
  });
});

describe("listProperties", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns empty array when response is not ok", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(false, []));

    const result = await listProperties();
    expect(result).toEqual([]);
  });

  it("returns properties on success", async () => {
    const data = [{ id: 1, alias: "Casa", property_type: "Casa", active: true }];
    mockFetch.mockResolvedValueOnce(mockResponse(true, data));

    const result = await listProperties();
    expect(result).toEqual(data);
  });
});

describe("listPropertyAppliances", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns empty array when response is not ok", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(false, []));

    const result = await listPropertyAppliances(1);
    expect(result).toEqual([]);
  });
});

describe("deleteProperty", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sends DELETE to /properties/{id} (F073)", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(true, {}));

    await deleteProperty(10);

    expect(mockFetch).toHaveBeenCalledWith(
      `${API_URL}/properties/10`,
      expect.objectContaining({
        method: "DELETE",
        credentials: "include",
      }),
    );
  });

  it("não lança quando o backend responde 204 no content", async () => {
    const resp = { ok: true, status: 204 } as Response;
    mockFetch.mockResolvedValueOnce(resp);

    await expect(deleteProperty(10)).resolves.toBeUndefined();
  });

  it("throws ApiError on failure", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(false, { message: "erro ao excluir" }));

    await expect(deleteProperty(10)).rejects.toThrow("erro ao excluir");
  });
});

describe("updateProperty", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sends PUT to /properties/{id} with snake_case fields", async () => {
    const data = { id: 1, alias: "Casa", property_type: "Casa", active: true };
    mockFetch.mockResolvedValueOnce(mockResponse(true, data));

    const result = await updateProperty(1, "Casa", "Casa", true, "Rua X", 2, 50);

    expect(result).toEqual(data);
    expect(mockFetch).toHaveBeenCalledWith(
      `${API_URL}/properties/1`,
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({
          alias: "Casa",
          property_type: "Casa",
          active: true,
          address: "Rua X",
          resident_count: 2,
          area_sqm: 50,
        }),
      }),
    );
  });
});

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

describe("fetchPreferences", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns peak_hour_usage and high_consumption_hours from /auth/me (F069/B051)", async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse(true, {
        consumption_goal: 250,
        regularity: "instantanea",
        peak_hour_usage: true,
        high_consumption_hours: 4.5,
      }),
    );

    const result = await fetchPreferences();

    expect(result).toEqual({
      consumption_goal: 250,
      regularity: "instantanea",
      peak_hour_usage: true,
      high_consumption_hours: 4.5,
    });
    expect(mockFetch).toHaveBeenCalledWith(
      `${API_URL}/auth/me`,
      expect.objectContaining({
        credentials: "include",
      }),
    );
  });

  it("returns {} when peak_hour_usage is absent (contrato anterior)", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(true, { regularity: "diaria" }));

    const result = await fetchPreferences();
    expect(result.peak_hour_usage).toBeUndefined();
    expect(result.regularity).toBe("diaria");
  });

  it("returns {} when response is not ok", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(false, { message: "Unauthorized" }));

    const result = await fetchPreferences();
    expect(result).toEqual({});
  });
});

describe("updatePreferences", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sends PUT to /auth/preferences with peak_hour_usage and high_consumption_hours (F069)", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(true, {}));

    await updatePreferences({
      regularity: "instantanea",
      peak_hour_usage: true,
      high_consumption_hours: 4.5,
    });

    expect(mockFetch).toHaveBeenCalledWith(`${API_URL}/auth/preferences`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        regularity: "instantanea",
        peak_hour_usage: true,
        high_consumption_hours: 4.5,
      }),
    });
  });

  it("throws on failure", async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse(false, { message: "Erro ao salvar preferências" }),
    );

    await expect(
      updatePreferences({ peak_hour_usage: false, high_consumption_hours: 6 }),
    ).rejects.toThrow("Erro ao salvar preferências");
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
