import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchPreferences, updatePreferences } from "../../services/api";
import { API_URL, mockFetch, mockResponse } from "./helpers";

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
