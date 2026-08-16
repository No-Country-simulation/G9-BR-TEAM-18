import { describe, it, expect } from "vitest";
import { resolveApplianceIcon } from "../../data/appliance-icons";

/* =========================================================================
 * resolveApplianceIcon(name, mlCategory?)
 * ========================================================================= */
describe("resolveApplianceIcon", () => {
  // --- Match por keyword (caminho principal) ---
  it("retorna 'Refrigerator' para 'Geladeira Frost Free'", () => {
    expect(resolveApplianceIcon("Geladeira Frost Free")).toBe("Refrigerator");
  });

  it("retorna 'Refrigerator' para 'Refrigerador 2 portas'", () => {
    expect(resolveApplianceIcon("Refrigerador 2 portas")).toBe("Refrigerator");
  });

  it("retorna 'AirVent' para 'Ar Condicionado 12000 BTUs'", () => {
    expect(resolveApplianceIcon("Ar Condicionado 12000 BTUs")).toBe("AirVent");
  });

  it("retorna 'Fan' para 'Ventilador de Teto'", () => {
    expect(resolveApplianceIcon("Ventilador de Teto")).toBe("Fan");
  });

  it("retorna 'Tv' para 'Televisao 55 polegadas'", () => {
    expect(resolveApplianceIcon("Televisao 55 polegadas")).toBe("Tv");
  });

  it("retorna 'Computer' para 'Computador Desktop'", () => {
    expect(resolveApplianceIcon("Computador Desktop")).toBe("Computer");
  });

  it("retorna 'Laptop' para 'Notebook Dell'", () => {
    expect(resolveApplianceIcon("Notebook Dell")).toBe("Laptop");
  });

  it("retorna 'Lightbulb' para 'Lampada LED 9W'", () => {
    expect(resolveApplianceIcon("Lampada LED 9W")).toBe("Lightbulb");
  });

  it("retorna 'Microwave' para 'Micro-ondas' (hífen)", () => {
    expect(resolveApplianceIcon("Micro-ondas")).toBe("Microwave");
  });

  it("retorna 'CookingPot' para 'Fogao 4 bocas'", () => {
    expect(resolveApplianceIcon("Fogao 4 bocas")).toBe("CookingPot");
  });

  it("retorna 'WashingMachine' para 'Maquina de Lavar'", () => {
    expect(resolveApplianceIcon("Maquina de Lavar")).toBe("WashingMachine");
  });

  it("retorna 'ShowerHead' para 'Chuveiro Eletrico'", () => {
    expect(resolveApplianceIcon("Chuveiro Eletrico")).toBe("ShowerHead");
  });

  it("keyword 'videogame' não match p/ 'Video Game PS5' (espaço) → HelpCircle", () => {
    // A keyword "videogame" (sem espaços) não está contida em "video game"
    expect(resolveApplianceIcon("Video Game PS5")).toBe("HelpCircle");
  });

  it("retorna 'Gamepad2' para 'Videogame PS5'", () => {
    expect(resolveApplianceIcon("Videogame PS5")).toBe("Gamepad2");
  });

  // --- Acentos: verify NFD normalization works ---
  it("ignora acentos: 'Ar-Condicionado' → AirVent", () => {
    expect(resolveApplianceIcon("Ar-Condicionado")).toBe("AirVent");
  });

  it("ignora acentos: 'Lâmpada' → Lightbulb", () => {
    expect(resolveApplianceIcon("Lâmpada Incandescente")).toBe("Lightbulb");
  });

  it("ignora acentos: 'Micro-ondas' (agudo) → Microwave", () => {
    expect(resolveApplianceIcon("Micro-ondas")).toBe("Microwave");
  });

  // --- Fallback por categoria ---
  it("fallback: mlCategory='REFRIGERATION' → Refrigerator", () => {
    expect(resolveApplianceIcon("Equipamento Desconhecido", "REFRIGERATION")).toBe("Refrigerator");
  });

  it("fallback: mlCategory='CLIMATE_CONTROL' → AirVent", () => {
    expect(resolveApplianceIcon("Equipamento", "CLIMATE_CONTROL")).toBe("AirVent");
  });

  it("fallback: mlCategory='LIGHTING' → Lightbulb", () => {
    expect(resolveApplianceIcon("Equipamento", "LIGHTING")).toBe("Lightbulb");
  });

  it("fallback: mlCategory='TECHNOLOGY' → Monitor", () => {
    expect(resolveApplianceIcon("Equipamento", "TECHNOLOGY")).toBe("Monitor");
  });

  it("fallback: mlCategory='APPLIANCES' → CookingPot", () => {
    expect(resolveApplianceIcon("Equipamento", "APPLIANCES")).toBe("CookingPot");
  });

  it("fallback: mlCategory='SERVICES' → Wrench", () => {
    expect(resolveApplianceIcon("Equipamento", "SERVICES")).toBe("Wrench");
  });

  it("fallback: mlCategory='OTHERS' → HelpCircle", () => {
    expect(resolveApplianceIcon("Equipamento", "OTHERS")).toBe("HelpCircle");
  });

  // --- Match normalizado (uppercase + underscore) ---
  it("fallback normalizado: 'climate-control' (hífen) → AirVent", () => {
    expect(resolveApplianceIcon("Novo Aparelho", "climate-control")).toBe("AirVent");
  });

  it("fallback normalizado: 'Climatização' (acento) → AirVent", () => {
    expect(resolveApplianceIcon("Novo Aparelho", "Climatização")).toBe("AirVent");
  });

  it("fallback normalizado: 'refrigeration' (minúsculo) → Refrigerator", () => {
    expect(resolveApplianceIcon("Novo", "refrigeration")).toBe("Refrigerator");
  });

  it("fallback normalizado: 'iluminação' (acento, minúsculo) → Lightbulb", () => {
    expect(resolveApplianceIcon("Novo", "iluminação")).toBe("Lightbulb");
  });

  // --- Compatibilidade retroativa (português) ---
  it("compatibilidade: 'Refrigeracao' (PT) → Refrigerator", () => {
    expect(resolveApplianceIcon("Equipamento", "Refrigeracao")).toBe("Refrigerator");
  });

  it("compatibilidade: 'Climatizacao' (PT) → AirVent", () => {
    expect(resolveApplianceIcon("Equipamento", "Climatizacao")).toBe("AirVent");
  });

  // --- Keyword tem precedência sobre categoria ---
  it("keyword tem precedência: nome='Geladeira', mlCategory='CLIMATE_CONTROL' → Refrigerator", () => {
    expect(resolveApplianceIcon("Geladeira", "CLIMATE_CONTROL")).toBe("Refrigerator");
  });

  it("keyword tem precedência: nome='TV LED', mlCategory='APPLIANCES' → Tv", () => {
    expect(resolveApplianceIcon("TV LED", "APPLIANCES")).toBe("Tv");
  });

  // --- Casos sem match ---
  it("sem keyword nem categoria → HelpCircle", () => {
    expect(resolveApplianceIcon("Aparelho Inventado")).toBe("HelpCircle");
  });

  it("mlCategory vazio → HelpCircle", () => {
    expect(resolveApplianceIcon("Aparelho", "")).toBe("HelpCircle");
  });

  it("mlCategory undefined → HelpCircle", () => {
    expect(resolveApplianceIcon("Aparelho")).toBe("HelpCircle");
  });

  it("categoria inexistente no fallback → HelpCircle", () => {
    expect(resolveApplianceIcon("Aparelho", "CATEGORIA_INEXISTENTE")).toBe("HelpCircle");
  });

  // --- Case sensitivity: nome tem case diferente ---
  it("case-insensitive: 'GELADEIRA' maiúsculo → Refrigerator", () => {
    expect(resolveApplianceIcon("GELADEIRA FROST FREE")).toBe("Refrigerator");
  });
});
