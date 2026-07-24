import { describe, it, expect } from "vitest";
import { CATEGORY_DISPLAY, CATEGORY_COLORS, ApiError } from "../types";

describe("CATEGORY_DISPLAY", () => {
  it("returns label for EXCELENTE", () => {
    expect(CATEGORY_DISPLAY.EXCELENTE).toBe("Excelente");
  });

  it("returns label for BOM", () => {
    expect(CATEGORY_DISPLAY.BOM).toBe("Bom");
  });

  it("returns label for MEDIANO", () => {
    expect(CATEGORY_DISPLAY.MEDIANO).toBe("Mediano");
  });

  it("returns label for RUIM", () => {
    expect(CATEGORY_DISPLAY.RUIM).toBe("Ruim");
  });

  it("returns label for CRITICO", () => {
    expect(CATEGORY_DISPLAY.CRITICO).toBe("Crítico");
  });
});

describe("CATEGORY_COLORS", () => {
  it("returns dark green for EXCELENTE", () => {
    expect(CATEGORY_COLORS.EXCELENTE).toBe("#059669");
  });

  it("returns green for BOM", () => {
    expect(CATEGORY_COLORS.BOM).toBe("#10b981");
  });

  it("returns yellow for MEDIANO", () => {
    expect(CATEGORY_COLORS.MEDIANO).toBe("#f59e0b");
  });

  it("returns orange for RUIM", () => {
    expect(CATEGORY_COLORS.RUIM).toBe("#f97316");
  });

  it("returns red for CRITICO", () => {
    expect(CATEGORY_COLORS.CRITICO).toBe("#ef4444");
  });
});

describe("ApiError", () => {
  it("creates error with message and fields", () => {
    const err = new ApiError("Erro de validação", { consumption_kwh: "deve ser positivo" });
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe("Erro de validação");
    expect(err.fields).toEqual({ consumption_kwh: "deve ser positivo" });
    expect(err.name).toBe("ApiError");
  });

  it("accepts empty fields", () => {
    const err = new ApiError("Algo deu errado", {});
    expect(err.message).toBe("Algo deu errado");
    expect(err.fields).toEqual({});
  });
});
