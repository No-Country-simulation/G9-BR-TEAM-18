/**
 * Catálogo de ícones por palavra-chave para equipamentos.
 *
 * Baseado no levantamento dos dados reais do ML Service:
 *   - pph-data-complete.csv (11 equipment types from PPH 2019 survey)
 *   - rotuled-ml-processed.csv (24+ appliance names from product lists)
 *   - features.py (7 consumption categories)
 *
 * Cada entrada mapeia uma palavra-chave (sem acentos, minúscula) ao
 * nome de um ícone Lucide específico. A função resolveApplianceIcon()
 * faz a busca case-insensitive e tolerante a acentos.
 *
 * Se um novo equipamento for adicionado pelo ML Service e não houver
 * keyword correspondente, o fallback por categoria (CATEGORY_FALLBACK)
 * garante que sempre haverá um ícone representativo.
 */

export interface ApplianceIconEntry {
  icon: string;
}

/**
 * Mapa de palavras-chave → ícones Lucide específicos.
 * A chave deve estar em minúsculo, sem acentos.
 */
export const APPLIANCE_ICONS: Record<string, ApplianceIconEntry> = {
  // =========================================================
  // REFRIGERAÇÃO
  // =========================================================
  geladeira: { icon: "Refrigerator" },
  refrigerador: { icon: "Refrigerator" },
  freezer: { icon: "Refrigerator" },
  frigobar: { icon: "Refrigerator" },
  bebedouro: { icon: "Droplets" },
  "maquina de gelo": { icon: "Refrigerator" },

  // =========================================================
  // CLIMATIZAÇÃO
  // =========================================================
  "ar-condicionado": { icon: "AirVent" },
  "ar condicionado": { icon: "AirVent" },
  "ar condicionado split": { icon: "AirVent" },
  split: { icon: "AirVent" },
  climatizador: { icon: "AirVent" },
  aquecedor: { icon: "Flame" },
  ventilador: { icon: "Fan" },
  "ventilador de teto": { icon: "Fan" },
  circulador: { icon: "Fan" },

  // =========================================================
  // ILUMINAÇÃO
  // =========================================================
  lampada: { icon: "Lightbulb" },
  "lampada led": { icon: "Lightbulb" },
  "lampada fluorescente": { icon: "Lightbulb" },
  "lampada incandescente": { icon: "Lightbulb" },
  lustre: { icon: "LampCeiling" },
  luminaria: { icon: "Lamp" },

  // =========================================================
  // TECNOLOGIA
  // =========================================================
  televisao: { icon: "Tv" },
  tv: { icon: "Tv" },
  monitor: { icon: "Monitor" },
  computador: { icon: "Computer" },
  "computador desktop": { icon: "Computer" },
  desktop: { icon: "Computer" },
  notebook: { icon: "Laptop" },
  laptop: { icon: "Laptop" },
  videogame: { icon: "Gamepad2" },
  console: { icon: "Gamepad2" },
  playstation: { icon: "Gamepad2" },
  xbox: { icon: "Gamepad2" },
  roteador: { icon: "Router" },
  modem: { icon: "Router" },
  "wi-fi": { icon: "Router" },
  carregador: { icon: "PlugZap" },
  nobreak: { icon: "BatteryCharging" },
  "no-break": { icon: "BatteryCharging" },

  // =========================================================
  // ELETRODOMÉSTICOS
  // =========================================================
  "micro-ondas": { icon: "Microwave" },
  microondas: { icon: "Microwave" },
  forno: { icon: "CookingPot" },
  fogao: { icon: "CookingPot" },
  "fogao eletrico": { icon: "CookingPot" },
  cooktop: { icon: "CookingPot" },
  liquidificador: { icon: "CookingPot" },
  batedeira: { icon: "CookingPot" },
  "maquina de lavar": { icon: "WashingMachine" },
  "maquina de lavar e secar": { icon: "WashingMachine" },
  "maquina de secar": { icon: "WashingMachine" },
  lavadora: { icon: "WashingMachine" },
  secadora: { icon: "WashingMachine" },
  "lava e seca": { icon: "WashingMachine" },
  "air fryer": { icon: "ChefHat" },
  fritadeira: { icon: "ChefHat" },
  "fritadeira eletrica": { icon: "ChefHat" },
  cafeteira: { icon: "Coffee" },
  "ferro de passar": { icon: "Sparkles" },
  "ferro eletrico": { icon: "Sparkles" },
  aspirador: { icon: "Vacuum" },
  "aspirador de po": { icon: "Vacuum" },

  // =========================================================
  // SERVIÇOS
  // =========================================================
  chuveiro: { icon: "ShowerHead" },
  "chuveiro eletrico": { icon: "ShowerHead" },
  torneira: { icon: "ShowerHead" },
  "bomba dagua": { icon: "Droplets" },
  "bomba d'agua": { icon: "Droplets" },
  bomba: { icon: "Droplets" },
  portao: { icon: "DoorOpen" },
  "portao eletrico": { icon: "DoorOpen" },
  "motor de piscina": { icon: "Waves" },
  "motor piscina": { icon: "Waves" },
  piscina: { icon: "Waves" },
};

/**
 * Fallback por categoria para quando o nome do aparelho não
 * corresponde a nenhuma keyword conhecida.
 */
const CATEGORY_FALLBACK: Record<string, string> = {
  REFRIGERATION: "Refrigerator",
  CLIMATE_CONTROL: "AirVent",
  LIGHTING: "Lightbulb",
  TECHNOLOGY: "Monitor",
  APPLIANCES: "CookingPot",
  SERVICES: "Wrench",
};

/**
 * Resolve o ícone Lucide para um aparelho.
 *
 * 1. Busca por palavra-chave no nome (case-insensitive, sem acentos)
 * 2. Se não encontrar, usa fallback pela categoria
 * 3. Se não tiver nem categoria, retorna HelpCircle
 *
 * @param name Nome do aparelho (ex: "Geladeira Frost Free")
 * @param mlCategory Categoria ML (ex: "REFRIGERATION")
 * @returns Nome do ícone Lucide (ex: "Refrigerator")
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

// =========================================================
// CATEGORIAS — Display utilities
// =========================================================

interface CategoryDisplay {
  label: string;
  icon: string;
  color: string;
}

/**
 * Ordem de exibição preferencial para categorias conhecidas.
 * Categorias não listadas aparecem no final em ordem alfabética.
 */
const CATEGORY_PRIORITY: string[] = [
  "Refrigeracao",
  "Climatizacao",
  "Tecnologia",
  "Iluminacao",
  "Eletrodomesticos",
  "Servicos",
];

/**
 * Retorna os dados de exibição de uma categoria (label, ícone, cor).
 * Funciona tanto com chaves em português ("Refrigeracao") quanto
 * em inglês ("REFRIGERATION") para compatibilidade futura com ADR-0027.
 */
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

/**
 * Ordena categorias: conhecidas primeiro (na ordem definida),
 * desconhecidas no final em ordem alfabética.
 */
export function sortCategories(cats: string[]): string[] {
  return [...cats].sort((a, b) => {
    const ai = CATEGORY_PRIORITY.indexOf(a);
    const bi = CATEGORY_PRIORITY.indexOf(b);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });
}
