import { describe, expect, it } from "vitest";
import { resolveAnalysisSource } from "../types";

describe("resolveAnalysisSource", () => {
  it("retorna 'ml' para o classificador treinado (contrato: model)", () => {
    expect(resolveAnalysisSource("model")).toBe("ml");
  });

  it("retorna 'ml' para model com sufixo descritivo (contrato: model (confidence ...))", () => {
    expect(resolveAnalysisSource("model (confidence 62.5%)")).toBe("ml");
  });

  it("retorna 'ml' para model+groq (classificador com fallback LLM)", () => {
    expect(resolveAnalysisSource("model+groq (confidence 62.5%)")).toBe("ml");
  });

  it("retorna 'fallback' para rule-based (contrato: rule-based ...)", () => {
    expect(resolveAnalysisSource("rule-based (model error)")).toBe("fallback");
    expect(resolveAnalysisSource("rule-based (model unavailable)")).toBe("fallback");
  });

  it("retorna 'ml' quando o groq falhou mas a classificacao veio do modelo", () => {
    expect(resolveAnalysisSource("model+rule-based (groq failed) (confidence 62.5%)")).toBe("ml");
  });

  it("retorna 'fallback' para o legado 'FALLBACK'", () => {
    expect(resolveAnalysisSource("FALLBACK")).toBe("fallback");
  });

  it("retorna 'ml' para o legado 'ML'", () => {
    expect(resolveAnalysisSource("ML")).toBe("ml");
  });

  it("retorna undefined para valores ausentes ou desconhecidos", () => {
    expect(resolveAnalysisSource(undefined)).toBeUndefined();
    expect(resolveAnalysisSource("")).toBeUndefined();
    expect(resolveAnalysisSource("qualquer-coisa")).toBeUndefined();
  });

  it("é case-insensitive e tolera espaços", () => {
    expect(resolveAnalysisSource("  MODEL  ")).toBe("ml");
    expect(resolveAnalysisSource("Rule-Based (Model Unavailable)")).toBe("fallback");
  });
});
