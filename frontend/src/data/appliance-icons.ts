/**
 * Catálogo de ícones por palavra-chave para equipamentos.
 *
 * Cada entrada mapeia uma palavra-chave (sem acentos, minúscula) ao
 * nome de um ícone Lucide específico. A função resolveApplianceIcon()
 * faz a busca case-insensitive e tolerante a acentos.
 *
 * Se um novo equipamento for adicionado e não houver keyword
 * correspondente, o fallback por categoria (CATEGORY_FALLBACK)
 * garante que sempre haverá um ícone representativo.
 */

export interface ApplianceIconEntry {
  icon: string;
}

export const APPLIANCE_ICONS: Record<string, ApplianceIconEntry> = {
  // Refrigeração
  geladeira: { icon: "Refrigerator" },
  refrigerador: { icon: "Refrigerator" },
  freezer: { icon: "Refrigerator" },
  frigobar: { icon: "Refrigerator" },
  bebedouro: { icon: "Droplets" },

  // Climatização
  "ar-condicionado": { icon: "AirVent" },
  "ar condicionado": { icon: "AirVent" },
  split: { icon: "AirVent" },
  climatizador: { icon: "AirVent" },
  aquecedor: { icon: "Flame" },
  ventilador: { icon: "Fan" },

  // Iluminação
  lampada: { icon: "Lightbulb" },
  lustre: { icon: "LampCeiling" },
  luminaria: { icon: "Lamp" },

  // Tecnologia
  televisao: { icon: "Tv" },
  tv: { icon: "Tv" },
  monitor: { icon: "Monitor" },
  computador: { icon: "Computer" },
  desktop: { icon: "Computer" },
  notebook: { icon: "Laptop" },
  laptop: { icon: "Laptop" },
  videogame: { icon: "Gamepad2" },
  console: { icon: "Gamepad2" },
  roteador: { icon: "Router" },
  modem: { icon: "Router" },
  carregador: { icon: "PlugZap" },
  nobreak: { icon: "BatteryCharging" },

  // Eletrodomésticos
  "micro-ondas": { icon: "Microwave" },
  microondas: { icon: "Microwave" },
  forno: { icon: "CookingPot" },
  fogao: { icon: "CookingPot" },
  cooktop: { icon: "CookingPot" },
  liquidificador: { icon: "CookingPot" },
  batedeira: { icon: "CookingPot" },
  "maquina de lavar": { icon: "WashingMachine" },
  lavadora: { icon: "WashingMachine" },
  secadora: { icon: "WashingMachine" },
  "air fryer": { icon: "ChefHat" },
  fritadeira: { icon: "ChefHat" },
  cafeteira: { icon: "Coffee" },
  "ferro de passar": { icon: "Sparkles" },
  aspirador: { icon: "Vacuum" },

  // Serviços
  chuveiro: { icon: "ShowerHead" },
  "chuveiro eletrico": { icon: "ShowerHead" },
  torneira: { icon: "ShowerHead" },
  bomba: { icon: "Droplets" },
  portao: { icon: "DoorOpen" },
  piscina: { icon: "Waves" },
};

const CATEGORY_FALLBACK: Record<string, string> = {
  // Chaves em inglês (contrato do backend / ADR-0027)
  REFRIGERATION: "Refrigerator",
  CLIMATE_CONTROL: "AirVent",
  LIGHTING: "Lightbulb",
  TECHNOLOGY: "Monitor",
  APPLIANCES: "CookingPot",
  SERVICES: "Wrench",
  OTHERS: "HelpCircle",
  // Chaves em português (compatibilidade retroativa)
  REFRIGERACAO: "Refrigerator",
  CLIMATIZACAO: "AirVent",
  ILUMINACAO: "Lightbulb",
  TECNOLOGIA: "Monitor",
  ELETRODOMESTICOS: "CookingPot",
  SERVICOS: "Wrench",
  OUTROS: "HelpCircle",
  /*
   * NOTA: Apenas chaves MAIÚSCULAS são necessárias aqui.
   * A função resolveApplianceIcon() usa normalizeCategoryKey() que
   * converte qualquer entrada para UPPER_CASE antes do lookup,
   * capturando automaticamente variações como "Refrigeracao",
   * "climate-control", "Climatização" etc.
   */
};/**
 * Remove acentos/sinais diacríticos de uma string usando normalização NFD.
 * Ex: "Refrigeração" → "Refrigeracao", "Climatização" → "Climatizacao"
 */
function removeAccents(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * Normaliza uma string de categoria para lookup no CATEGORY_FALLBACK.
 * Converte para uppercase, remove acentos, substitui espaços/hífens por underscore.
 * Ex: "CLIMATE_CONTROL" → "CLIMATE_CONTROL", "Refrigeracao" → "REFRIGERACAO"
 */
function normalizeCategoryKey(cat: string): string {
  return removeAccents(cat.toUpperCase())
    .replace(/[\s-]/g, "_")                // normaliza separadores
    .replace(/[^A-Z_]/g, "");               // remove caracteres não-alfabéticos
}

/**
 * Resolve o ícone Lucide para um aparelho.
 *
 * 1. Busca por palavra-chave no nome (case-insensitive, sem acentos)
 * 2. Se não encontrar, usa fallback pela categoria (normalizado)
 * 3. Se não tiver nem categoria, retorna HelpCircle
 */
export function resolveApplianceIcon(name: string, mlCategory?: string): string {
  const normalized = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  for (const [keyword, entry] of Object.entries(APPLIANCE_ICONS)) {
    if (normalized.includes(keyword)) {
      return entry.icon;
    }
  }

  if (mlCategory) {
    // Tenta match exato primeiro
    const exact = CATEGORY_FALLBACK[mlCategory];
    if (exact) return exact;

    // Tenta match normalizado (uppercase + underscore)
    const key = normalizeCategoryKey(mlCategory);
    const fallback = CATEGORY_FALLBACK[key];
    if (fallback) return fallback;
  }

  return "HelpCircle";
}

export interface CategoryDisplay {
  label: string;
  icon: string;
  color: string;
}

/**
 * Gera uma cor HSL estável a partir de um hash do nome da categoria.
 * Garante que uma mesma categoria desconhecida sempre tenha a mesma cor.
 */
function hashColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 60%, 50%)`;
}

/**
 * Converte uma chave de categoria (ex: "REFRIGERATION", "SERVICES")
 * em um rótulo amigável em português.
 * Usa um registry de categorias conhecidas + fallback inteligente.
 */
function categoryLabel(key: string): string {
  const labels: Record<string, string> = {
    REFRIGERATION: "Refrigeração",
    REFRIGERACAO: "Refrigeração",
    CLIMATE_CONTROL: "Climatização",
    CLIMATIZACAO: "Climatização",
    TECHNOLOGY: "Tecnologia",
    TECNOLOGIA: "Tecnologia",
    LIGHTING: "Iluminação",
    ILUMINACAO: "Iluminação",
    APPLIANCES: "Eletrodomésticos",
    ELETRODOMESTICOS: "Eletrodomésticos",
    SERVICES: "Serviços",
    SERVICOS: "Serviços",
    OTHERS: "Outros",
    OUTROS: "Outros",
  };
  return labels[key] ?? key.charAt(0) + key.slice(1).toLowerCase().replace(/_/g, " ");
}

/**
 * Cores conhecidas para categorias de consumo.
 * Para categorias desconhecidas, deriva cor via hash do nome.
 */
function categoryColor(upperKey: string): string {
  const colors: Record<string, string> = {
    REFRIGERATION: "#0ea5e9",
    REFRIGERACAO: "#0ea5e9",
    CLIMATE_CONTROL: "#06b6d4",
    CLIMATIZACAO: "#06b6d4",
    TECHNOLOGY: "#8b5cf6",
    TECNOLOGIA: "#8b5cf6",
    LIGHTING: "#f59e0b",
    ILUMINACAO: "#f59e0b",
    APPLIANCES: "#ec4899",
    ELETRODOMESTICOS: "#ec4899",
    SERVICES: "#14b8a6",
    SERVICOS: "#14b8a6",
    OTHERS: "#6b7280",
    OUTROS: "#6b7280",
  };
  return colors[upperKey] ?? hashColor(upperKey);
}

/**
 * Ícones conhecidos para categorias de consumo.
 */
function categoryIcon(upperKey: string): string {
  const icons: Record<string, string> = {
    REFRIGERATION: "Snowflake",
    REFRIGERACAO: "Snowflake",
    CLIMATE_CONTROL: "Wind",
    CLIMATIZACAO: "Wind",
    TECHNOLOGY: "Monitor",
    TECNOLOGIA: "Monitor",
    LIGHTING: "Lightbulb",
    ILUMINACAO: "Lightbulb",
    APPLIANCES: "Home",
    ELETRODOMESTICOS: "Home",
    SERVICES: "Wrench",
    SERVICOS: "Wrench",
    OTHERS: "HelpCircle",
    OUTROS: "HelpCircle",
  };
  return icons[upperKey] ?? "HelpCircle";
}

export function getCategoryDisplay(cat: string): CategoryDisplay {
  // Normaliza: uppercase + remove acentos (NFD)
  // Isso garante que "Refrigeração" → "REFRIGERACAO"
  // e "CLIMATE_CONTROL" → "CLIMATE_CONTROL"
  const key = removeAccents(cat.toUpperCase());
  return {
    label: categoryLabel(key),
    icon: categoryIcon(key),
    color: categoryColor(key),
  };
}

const CATEGORY_PRIORITY: string[] = [
  "REFRIGERATION",
  "REFRIGERACAO",
  "CLIMATE_CONTROL",
  "CLIMATIZACAO",
  "TECHNOLOGY",
  "TECNOLOGIA",
  "LIGHTING",
  "ILUMINACAO",
  "APPLIANCES",
  "ELETRODOMESTICOS",
  "SERVICES",
  "SERVICOS",
  "OTHERS",
  "OUTROS",
];

export function sortCategories(cats: string[]): string[] {
  return [...cats].sort((a, b) => {
    // Normaliza: uppercase + remove acentos (NFD) + normaliza separadores
    // para que variações como "Refrigeração", "refrigeration",
    // "Climatizacao" sejam ordenadas na posição correta.
    const normalize = (s: string) =>
      removeAccents(s.toUpperCase()).replace(/[\s-]/g, "_");
    const ai = CATEGORY_PRIORITY.indexOf(normalize(a));
    const bi = CATEGORY_PRIORITY.indexOf(normalize(b));
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });
}
