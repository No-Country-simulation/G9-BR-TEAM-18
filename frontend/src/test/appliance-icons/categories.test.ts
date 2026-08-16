import { describe, it, expect } from "vitest";
import { getCategoryDisplay, sortCategories } from "../../data/appliance-icons";

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

  // --- Categorias acentuadas (como vem do backend: 'Refrigeração', 'Climatização'...) ---
  it("'Refrigeração' (acentuado) → mesma saída que REFRIGERATION", () => {
    expect(getCategoryDisplay("Refrigeração")).toEqual(getCategoryDisplay("REFRIGERATION"));
  });

  it("'Climatização' (acentuado) → mesma saída que CLIMATE_CONTROL", () => {
    expect(getCategoryDisplay("Climatização")).toEqual(getCategoryDisplay("CLIMATE_CONTROL"));
  });

  it("'Iluminação' (acentuado) → mesma saída que LIGHTING", () => {
    expect(getCategoryDisplay("Iluminação")).toEqual(getCategoryDisplay("LIGHTING"));
  });

  it("'Eletrodomésticos' (acentuado) → mesma saída que APPLIANCES", () => {
    expect(getCategoryDisplay("Eletrodomésticos")).toEqual(getCategoryDisplay("APPLIANCES"));
  });

  it("'Serviços' (acentuado) → mesma saída que SERVICES", () => {
    expect(getCategoryDisplay("Serviços")).toEqual(getCategoryDisplay("SERVICES"));
  });

  it("'Tecnologia' (sem acento) → mesma saída que TECHNOLOGY", () => {
    expect(getCategoryDisplay("Tecnologia")).toEqual(getCategoryDisplay("TECHNOLOGY"));
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

  it("normaliza 'Refrigeração' (acentuado) para posição correta", () => {
    const result = sortCategories(["Iluminação", "Refrigeração"]);
    // 'Refrigeração' → normalize → 'REFRIGERACAO' → CATEGORY_PRIORITY tem índice 1
    // 'Iluminação' → normalize → 'ILUMINACAO' → CATEGORY_PRIORITY tem índice 7
    expect(result[0]).toBe("Refrigeração");
    expect(result[1]).toBe("Iluminação");
  });

  // --- Categoria única ---
  it("array com um elemento retorna o mesmo elemento", () => {
    expect(sortCategories(["SERVICES"])).toEqual(["SERVICES"]);
  });
});
