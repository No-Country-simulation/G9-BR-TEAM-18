import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createProperty,
  listProperties,
  updateProperty,
  deleteProperty,
  listPropertyAppliances,
} from "../../services/api";
import { API_URL, mockFetch, mockResponse } from "./helpers";

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

describe("listPropertyAppliances", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns empty array when response is not ok", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(false, []));

    const result = await listPropertyAppliances(1);
    expect(result).toEqual([]);
  });
});
