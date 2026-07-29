import { describe, it, expect } from "vitest";
import { resolveApplianceIcon, getCategoryDisplay, sortCategories } from "../data/appliance-icons";
import { enrichAppliance } from "../data/appliances";

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

/* =========================================================================
 * getCategoryDisplay(cat)
 * ========================================================================= */
describe("getCategoryDisplay", () => {
  // --- Categorias conhecidas em inglês ---
  it("REFRIGERATION → label 'Refrigeração', icon Snowflake, color #0ea5e9", () => {
    const d = getCategoryDisplay("REFRIGERATION");
    expect(d.label).toBe("Refrigeração");
    expect(d.icon).toBe("Snowflake");
    expect(d.color).toBe("#0ea5e9");
  });

  it("CLIMATE_CONTROL → label 'Climatização', icon Wind, color #06b6d4", () => {
    const d = getCategoryDisplay("CLIMATE_CONTROL");
    expect(d.label).toBe("Climatização");
    expect(d.icon).toBe("Wind");
    expect(d.color).toBe("#06b6d4");
  });

  it("TECHNOLOGY → label 'Tecnologia', icon Monitor, color #8b5cf6", () => {
    const d = getCategoryDisplay("TECHNOLOGY");
    expect(d.label).toBe("Tecnologia");
    expect(d.icon).toBe("Monitor");
    expect(d.color).toBe("#8b5cf6");
  });

  it("LIGHTING → label 'Iluminação', icon Lightbulb, color #f59e0b", () => {
    const d = getCategoryDisplay("LIGHTING");
    expect(d.label).toBe("Iluminação");
    expect(d.icon).toBe("Lightbulb");
    expect(d.color).toBe("#f59e0b");
  });

  it("APPLIANCES → label 'Eletrodomésticos', icon Home, color #ec4899", () => {
    const d = getCategoryDisplay("APPLIANCES");
    expect(d.label).toBe("Eletrodomésticos");
    expect(d.icon).toBe("Home");
    expect(d.color).toBe("#ec4899");
  });

  it("SERVICES → label 'Serviços', icon Wrench, color #14b8a6", () => {
    const d = getCategoryDisplay("SERVICES");
    expect(d.label).toBe("Serviços");
    expect(d.icon).toBe("Wrench");
    expect(d.color).toBe("#14b8a6");
  });

  it("OTHERS → label 'Outros', icon HelpCircle, color #6b7280", () => {
    const d = getCategoryDisplay("OTHERS");
    expect(d.label).toBe("Outros");
    expect(d.icon).toBe("HelpCircle");
    expect(d.color).toBe("#6b7280");
  });

  // --- Categorias conhecidas em português ---
  it("REFRIGERACAO → mesma saída que REFRIGERATION", () => {
    expect(getCategoryDisplay("REFRIGERACAO")).toEqual(getCategoryDisplay("REFRIGERATION"));
  });

  it("CLIMATIZACAO → mesma saída que CLIMATE_CONTROL", () => {
    expect(getCategoryDisplay("CLIMATIZACAO")).toEqual(getCategoryDisplay("CLIMATE_CONTROL"));
  });

  it("TECNOLOGIA → mesma saída que TECHNOLOGY", () => {
    expect(getCategoryDisplay("TECNOLOGIA")).toEqual(getCategoryDisplay("TECHNOLOGY"));
  });

  it("ILUMINACAO → mesma saída que LIGHTING", () => {
    expect(getCategoryDisplay("ILUMINACAO")).toEqual(getCategoryDisplay("LIGHTING"));
  });

  it("ELETRODOMESTICOS → mesma saída que APPLIANCES", () => {
    expect(getCategoryDisplay("ELETRODOMESTICOS")).toEqual(getCategoryDisplay("APPLIANCES"));
  });

  it("SERVICOS → mesma saída que SERVICES", () => {
    expect(getCategoryDisplay("SERVICOS")).toEqual(getCategoryDisplay("SERVICES"));
  });

  it("OUTROS → mesma saída que OTHERS", () => {
    expect(getCategoryDisplay("OUTROS")).toEqual(getCategoryDisplay("OTHERS"));
  });

  // --- Case-insensitive: entrada em minúsculo ---
  it("'refrigeration' (minúsculo) → mesma saída que REFRIGERATION", () => {
    expect(getCategoryDisplay("refrigeration")).toEqual(getCategoryDisplay("REFRIGERATION"));
  });

  it("'services' (minúsculo) → mesma saída que SERVICES", () => {
    expect(getCategoryDisplay("services")).toEqual(getCategoryDisplay("SERVICES"));
  });

  // --- Categoria desconhecida com fallback inteligente ---
  it("HEATING → label legível 'Heating', icon HelpCircle", () => {
    const d = getCategoryDisplay("HEATING");
    expect(d.label).toBe("Heating");
    expect(d.icon).toBe("HelpCircle");
  });

  it("HEATING → cor derivada por hash (formato HSL)", () => {
    const d = getCategoryDisplay("HEATING");
    expect(d.color).toMatch(/^hsl\(\d+, 60%, 50%\)$/);
  });

  it("'CLIMATE_CONTROL' → label 'Climatização' (categoria conhecida, não fallback)", () => {
    const d = getCategoryDisplay("CLIMATE_CONTROL");
    expect(d.label).toBe("Climatização");
    expect(d.icon).toBe("Wind");
    expect(d.color).toBe("#06b6d4");
  });

  it("'MY_NEW_CATEGORY' (desconhecida) → fallback genérico: label 'My new category', icon HelpCircle", () => {
    const d = getCategoryDisplay("MY_NEW_CATEGORY");
    expect(d.label).toBe("My new category");
    expect(d.icon).toBe("HelpCircle");
    expect(d.color).toMatch(/^hsl\(/);
  });

  it("'OTROS' (minúsculo, espanhol) → fallback genérico: 'Otros', icon HelpCircle", () => {
    const d = getCategoryDisplay("OTROS");
    expect(d.label).toBe("Otros");
    expect(d.icon).toBe("HelpCircle");
    expect(d.color).toMatch(/^hsl\(/);
  });

  it("categoria desconhecida gera label com underscores substituídos por espaços", () => {
    // Uma categoria totalmente desconhecida
    const d = getCategoryDisplay("VERY_NEW_CATEGORY");
    // fallback: first char uppercase + rest lowercase + underscores → spaces
    expect(d.label).toBe("Very new category");
  });

  // --- Estabilidade do hash (mesma categoria = mesma cor sempre) ---
  it("'HEATING' sempre retorna a mesma cor em chamadas repetidas", () => {
    const a = getCategoryDisplay("HEATING");
    const b = getCategoryDisplay("HEATING");
    expect(a.color).toBe(b.color);
  });

  it("'COOLING' sempre retorna a mesma cor em chamadas repetidas", () => {
    const a = getCategoryDisplay("COOLING");
    const b = getCategoryDisplay("COOLING");
    expect(a.color).toBe(b.color);
  });

  // --- Cores diferentes para categorias diferentes ---
  it("HEATING e COOLING têm cores diferentes", () => {
    const h = getCategoryDisplay("HEATING");
    const c = getCategoryDisplay("COOLING");
    expect(h.color).not.toBe(c.color);
  });
});

/* =========================================================================
 * sortCategories(cats)
 * ========================================================================= */
describe("sortCategories", () => {
  // --- Ordem de prioridade definida ---
  it("coloca REFRIGERATION em primeiro", () => {
    const result = sortCategories(["LIGHTING", "REFRIGERATION", "SERVICES"]);
    expect(result[0]).toBe("REFRIGERATION");
  });

  it("coloca OTHERS em último entre as conhecidas", () => {
    const result = sortCategories(["OTHERS", "LIGHTING", "REFRIGERATION"]);
    expect(result[result.length - 1]).toBe("OTHERS");
  });

  it("ordena todas as 7 categorias na ordem correta", () => {
    const result = sortCategories([
      "APPLIANCES",
      "OTHERS",
      "TECHNOLOGY",
      "REFRIGERATION",
      "LIGHTING",
      "SERVICES",
      "CLIMATE_CONTROL",
    ]);
    expect(result).toEqual([
      "REFRIGERATION",
      "CLIMATE_CONTROL",
      "TECHNOLOGY",
      "LIGHTING",
      "APPLIANCES",
      "SERVICES",
      "OTHERS",
    ]);
  });

  // --- Categorias desconhecidas vão para o final ---
  it("categorias desconhecidas vão para o final", () => {
    const result = sortCategories(["LIGHTING", "HEATING", "REFRIGERATION"]);
    expect(result[0]).toBe("REFRIGERATION");
    expect(result[1]).toBe("LIGHTING");
    expect(result[2]).toBe("HEATING");
  });

  it("múltiplas desconhecidas mantêm ordem relativa entre si (stable sort)", () => {
    // ALPHA (idx 0) deve vir antes de ZEBRA (idx 2) pq stable sort preserva
    // a ordem original entre elementos com mesma prioridade (999)
    const result = sortCategories(["ALPHA", "LIGHTING", "ZEBRA", "REFRIGERATION"]);
    const idxAlpha = result.indexOf("ALPHA");
    const idxZebra = result.indexOf("ZEBRA");
    expect(idxAlpha).toBeLessThan(idxZebra);
  });

  // --- Imutabilidade ---
  it("não modifica o array original", () => {
    const original = ["SERVICES", "REFRIGERATION"];
    const copy = [...original];
    sortCategories(original);
    expect(original).toEqual(copy);
  });

  // --- Array vazio ---
  it("retorna array vazio para entrada vazia", () => {
    expect(sortCategories([])).toEqual([]);
  });

  // --- Variações de case ---
  it("normaliza 'refrigeration' (minúsculo) para ordem correta", () => {
    const result = sortCategories(["lighting", "refrigeration"]);
    expect(result[0]).toBe("refrigeration");
    expect(result[1]).toBe("lighting");
  });

  it("normaliza 'Climatizacao' (PT) para posição correta", () => {
    const result = sortCategories(["Tecnologia", "Climatizacao"]);
    // 'Climatizacao' → normalize → 'CLIMATIZACAO' → CATEGORY_PRIORITY tem índice 3
    // 'Tecnologia' → normalize → 'TECNOLOGIA' → CATEGORY_PRIORITY tem índice 5
    expect(result[0]).toBe("Climatizacao");
    expect(result[1]).toBe("Tecnologia");
  });

  // --- Categoria única ---
  it("array com um elemento retorna o mesmo elemento", () => {
    expect(sortCategories(["SERVICES"])).toEqual(["SERVICES"]);
  });
});

/* =========================================================================
 * Integração: fluxo completo de enrichAppliance (via appliances.ts)
 * Verifica se a integração entre enrichAppliance e resolveApplianceIcon
 * funciona corretamente com os valores do backend (ADR-0027).
 * ========================================================================= */

describe("enrichAppliance (integração)", () => {
  it("enriquece com ícone correto para refrigeracao em inglês", () => {
    const raw = {
      id: 1,
      name: "Geladeira",
      appliance_category: "REFRIGERATION",
      average_power_watts: 150,
      average_daily_use_hours: 24,
    };
    const result = enrichAppliance(raw);
    expect(result.icon).toBe("Refrigerator");
    expect(result.mlCategory).toBe("REFRIGERATION");
  });

  it("enriquece com ícone correto para climatizacao", () => {
    const raw = {
      id: 2,
      name: "Ar Condicionado",
      appliance_category: "CLIMATE_CONTROL",
      average_power_watts: 1400,
      average_daily_use_hours: 8,
    };
    const result = enrichAppliance(raw);
    expect(result.icon).toBe("AirVent");
  });

  it("enriquece aparelho desconhecido com fallback por categoria", () => {
    const raw = {
      id: 3,
      name: "Aparelho Desconhecido XYZ",
      appliance_category: "TECHNOLOGY",
      average_power_watts: 100,
      average_daily_use_hours: 5,
    };
    const result = enrichAppliance(raw);
    expect(result.icon).toBe("Monitor");
  });

  it("mapeia corretamente os campos", () => {
    const raw = {
      id: 42,
      name: "Televisao OLED",
      appliance_category: "TECHNOLOGY",
      average_power_watts: 200,
      average_daily_use_hours: 6,
    };
    const result = enrichAppliance(raw);
    expect(result.id).toBe("42");
    expect(result.name).toBe("Televisao OLED");
    expect(result.mlCategory).toBe("TECHNOLOGY");
    expect(result.powerWatts).toBe(200);
    expect(result.dailyUsageHours).toBe(6);
  });
});
