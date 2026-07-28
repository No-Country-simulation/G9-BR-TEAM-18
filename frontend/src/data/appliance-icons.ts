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
  Refrigeracao: "Refrigerator",
  Climatizacao: "AirVent",
  Iluminacao: "Lightbulb",
  Tecnologia: "Monitor",
  Eletrodomesticos: "CookingPot",
  Servicos: "Wrench",
};

/**
 * Resolve o ícone Lucide para um aparelho.
 *
 * 1. Busca por palavra-chave no nome (case-insensitive, sem acentos)
 * 2. Se não encontrar, usa fallback pela categoria
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
    const fallback = CATEGORY_FALLBACK[mlCategory];
    if (fallback) return fallback;
  }

  return "HelpCircle";
}

export interface CategoryDisplay {
  label: string;
  icon: string;
  color: string;
}

export function getCategoryDisplay(cat: string): CategoryDisplay {
  const upper = cat.toUpperCase();
  const map: Record<string, CategoryDisplay> = {
    REFRIGERACAO: { label: "Refrigeração", icon: "Snowflake", color: "#0ea5e9" },
    REFRIGERATION: { label: "Refrigeração", icon: "Snowflake", color: "#0ea5e9" },
    CLIMATIZACAO: { label: "Climatização", icon: "Wind", color: "#06b6d4" },
    CLIMATE_CONTROL: { label: "Climatização", icon: "Wind", color: "#06b6d4" },
    TECNOLOGIA: { label: "Tecnologia", icon: "Monitor", color: "#8b5cf6" },
    TECHNOLOGY: { label: "Tecnologia", icon: "Monitor", color: "#8b5cf6" },
    ILUMINACAO: { label: "Iluminação", icon: "Lightbulb", color: "#f59e0b" },
    LIGHTING: { label: "Iluminação", icon: "Lightbulb", color: "#f59e0b" },
    ELETRODOMESTICOS: { label: "Eletrodomésticos", icon: "Home", color: "#ec4899" },
    APPLIANCES: { label: "Eletrodomésticos", icon: "Home", color: "#ec4899" },
    SERVICOS: { label: "Serviços", icon: "Wrench", color: "#14b8a6" },
    SERVICES: { label: "Serviços", icon: "Wrench", color: "#14b8a6" },
  };
  return map[upper] ?? { label: cat, icon: "HelpCircle", color: "#6b7280" };
}

const CATEGORY_PRIORITY: string[] = [
  "Refrigeracao",
  "Climatizacao",
  "Tecnologia",
  "Iluminacao",
  "Eletrodomesticos",
  "Servicos",
];

export function sortCategories(cats: string[]): string[] {
  return [...cats].sort((a, b) => {
    const ai = CATEGORY_PRIORITY.indexOf(a);
    const bi = CATEGORY_PRIORITY.indexOf(b);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });
}
