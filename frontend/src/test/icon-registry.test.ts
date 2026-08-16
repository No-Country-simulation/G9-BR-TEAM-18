import { describe, it, expect } from "vitest";
import { resolveApplianceIcon, getCategoryDisplay } from "../data/appliance-icons";
import { ICON_REGISTRY } from "../components/iconRegistry";

/**
 * Garante que todo ícone resolvido pelo catálogo de aparelhos/categorias
 * existe no registry estático do LucideIcon.
 *
 * Contexto: o LucideIcon antes importava o pacote inteiro (`import * as
 * Icons`), então qualquer nome — mesmo inexistente — resolvia para um
 * componente ou null silencioso. Após a otimização do registry estático
 * (529 kB → 22 kB), um ícone esquecido renderizaria null sem aviso.
 * Este teste trava a classe de bug que já ocorreu com "Vacuum" (ícone que
 * não existe no lucide-react instalado).
 */

/* Amostras representativas que cobrem todas as chaves do catálogo
 * (APPLIANCE_ICONS + CATEGORY_FALLBACK). */
const APPLIANCE_SAMPLES: Array<{ name: string; category: string }> = [
  { name: "Geladeira", category: "REFRIGERATION" },
  { name: "Refrigerador frost free", category: "REFRIGERATION" },
  { name: "Freezer", category: "REFRIGERATION" },
  { name: "Ar-condicionado split", category: "CLIMATE_CONTROL" },
  { name: "Ventilador", category: "CLIMATE_CONTROL" },
  { name: "Aquecedor", category: "CLIMATE_CONTROL" },
  { name: "Lâmpada LED", category: "LIGHTING" },
  { name: "Lustre", category: "LIGHTING" },
  { name: "Televisão", category: "TECHNOLOGY" },
  { name: "Notebook", category: "TECHNOLOGY" },
  { name: "Videogame", category: "TECHNOLOGY" },
  { name: "Micro-ondas", category: "APPLIANCES" },
  { name: "Máquina de lavar", category: "APPLIANCES" },
  { name: "Air fryer", category: "APPLIANCES" },
  { name: "Aspirador de pó", category: "APPLIANCES" },
  { name: "Chuveiro elétrico", category: "SERVICES" },
  { name: "Portão eletrônico", category: "SERVICES" },
  { name: "Bomba d'água", category: "SERVICES" },
  { name: "Piscina", category: "SERVICES" },
];

const CATEGORIES = [
  "REFRIGERATION",
  "CLIMATE_CONTROL",
  "TECHNOLOGY",
  "LIGHTING",
  "APPLIANCES",
  "SERVICES",
  "OTHERS",
  // variações em português (compatibilidade retroativa)
  "REFRIGERACAO",
  "CLIMATIZACAO",
  "TECNOLOGIA",
  "ILUMINACAO",
  "ELETRODOMESTICOS",
  "SERVICOS",
  "OUTROS",
];

describe("icon registry coverage (LucideIcon)", () => {
  it("todo ícone resolvido pelo catálogo de aparelhos existe no registry", () => {
    for (const sample of APPLIANCE_SAMPLES) {
      const icon = resolveApplianceIcon(sample.name, sample.category);
      expect(ICON_REGISTRY[icon], `${icon} (de "${sample.name}") fora do registry`).toBeDefined();
    }
  });

  it("todo ícone de categoria (getCategoryDisplay) existe no registry", () => {
    for (const cat of CATEGORIES) {
      const { icon } = getCategoryDisplay(cat);
      expect(ICON_REGISTRY[icon], `${icon} (categoria "${cat}") fora do registry`).toBeDefined();
    }
  });

  it("nomes desconhecidos resolvem para fallback HelpCircle presente no registry", () => {
    const icon = resolveApplianceIcon("aparelho desconhecido", "");
    expect(icon).toBe("HelpCircle");
    expect(ICON_REGISTRY[icon]).toBeDefined();
  });
});
