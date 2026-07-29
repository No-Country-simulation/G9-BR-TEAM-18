import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  analyzeEnergy,
  login,
  register,
  listAnalyses,
  fetchDashboard,
  createProperty,
  listProperties,
  addApplianceToProperty,
  listPropertyAppliances,
  listAppliances,
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

describe("addApplianceToProperty", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sends POST to property appliances endpoint", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(true, {}));

    await addApplianceToProperty(1, 2, 3);

    expect(mockFetch).toHaveBeenCalledWith(`${API_URL}/properties/1/appliances`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ appliance_id: 2, quantity: 3 }),
    });
  });

  it("throws ApiError on failure", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(false, { message: "error", fields: {} }));

    await expect(addApplianceToProperty(1, 2, 3)).rejects.toThrow("error");
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

  it("returns enriched appliances on success", async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse(true, [
        {
          id: 1,
          name: "Geladeira",
          appliance_category: "REFRIGERATION",
          average_power_watts: 150,
          average_daily_use_hours: 24,
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
});
