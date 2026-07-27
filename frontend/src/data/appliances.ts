import type { ApplianceType } from "../types";

/**
 * Metadados de UI para aparelhos — usados exclusivamente para enriquecer
 * os dados vindos do backend com informação visual (ícone) e de cálculo
 * (campo de distribuição de potência).
 *
 * A chave é o nome do aparelho normalizado (minúsculo, sem acentos).
 * Se um aparelho do backend não estiver neste mapa, são usados valores
 * padrão (ícone "HelpCircle", distributionField "NONE").
 */
const METADATA_BY_NAME: Record<string, { icon: string; distributionField: string }> = {
  geladeira: { icon: "Snowflake", distributionField: "REFRIGERATION_WATTS" },
  "ar-condicionado": {
    icon: "Wind",
    distributionField: "AIR_CONDITIONING_WATTS",
  },
  ventilador: { icon: "Wind", distributionField: "AIR_CONDITIONING_WATTS" },
  "chuveiro elétrico": { icon: "ShowerHead", distributionField: "HEATING_WATTS" },
  "chuveiro eletrico": { icon: "ShowerHead", distributionField: "HEATING_WATTS" },
  lâmpada: { icon: "Lightbulb", distributionField: "LIGHTING_WATTS" },
  lampada: { icon: "Lightbulb", distributionField: "LIGHTING_WATTS" },
  televisão: { icon: "Tv", distributionField: "NONE" },
  televisao: { icon: "Tv", distributionField: "NONE" },
  tv: { icon: "Tv", distributionField: "NONE" },
  computador: { icon: "Monitor", distributionField: "NONE" },
  videogame: { icon: "Gamepad2", distributionField: "NONE" },
  "máquina de lavar": { icon: "Home", distributionField: "NONE" },
  "maquina de lavar": { icon: "Home", distributionField: "NONE" },
  "micro-ondas": { icon: "Microwave", distributionField: "NONE" },
  microondas: { icon: "Microwave", distributionField: "NONE" },
  "air fryer": { icon: "ChefHat", distributionField: "NONE" },
  "bomba d'água": { icon: "Droplets", distributionField: "NONE" },
  "bomba d'agua": { icon: "Droplets", distributionField: "NONE" },
  "portão elétrico": { icon: "DoorOpen", distributionField: "NONE" },
  "portao eletrico": { icon: "DoorOpen", distributionField: "NONE" },
  "motor de piscina": { icon: "Waves", distributionField: "NONE" },
};

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Normaliza o nome da categoria vindo do backend para o formato
 * usado no frontend (sem acentos, primeira letra maiuscula).
 *
 * O banco de dados armazena valores em portugues com acentos
 * (ex.: "Refrigeracao", "Climatizacao"), enquanto o frontend
 * usa chaves sem acentos ("Refrigeracao", "Climatizacao").
 */
const CATEGORY_NORMALIZE: Record<string, string> = {
  refrigeracao: "Refrigeracao",
  climatizacao: "Climatizacao",
  eletrodomesticos: "Eletrodomesticos",
  iluminacao: "Iluminacao",
  tecnologia: "Tecnologia",
  servicos: "Servicos",
  refrigeration: "Refrigeracao",
  climate_control: "Climatizacao",
  appliances: "Eletrodomesticos",
  lighting: "Iluminacao",
  technology: "Tecnologia",
  services: "Servicos",
};

function normalizeCategory(raw: string): string {
  const key = raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return CATEGORY_NORMALIZE[key] ?? key;
}

export function enrichAppliance(raw: {
  id: number;
  name: string;
  appliance_category: string;
  average_power_watts: number;
  average_daily_use_hours: number;
}): ApplianceType {
  const meta = METADATA_BY_NAME[normalizeName(raw.name)] ?? {
    icon: "HelpCircle",
    distributionField: "NONE",
  };
  return {
    id: String(raw.id),
    name: raw.name,
    mlCategory: normalizeCategory(raw.appliance_category),
    powerWatts: raw.average_power_watts,
    dailyUsageHours: raw.average_daily_use_hours,
    icon: meta.icon,
    distributionField: meta.distributionField,
  };
}
