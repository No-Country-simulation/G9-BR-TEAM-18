import { describe, it, expect, vi, beforeEach } from "vitest";
import { login, register } from "../../services/api";
import { API_URL, mockFetch, mockResponse } from "./helpers";

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
