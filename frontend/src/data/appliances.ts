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
const METADATA_BY_NAME: Record<
  string,
  { icon: string; distributionField: string }
> = {
  geladeira: { icon: "Snowflake", distributionField: "REFRIGERATION_WATTS" },
  "ar-condicionado": {
    icon: "Wind",
    distributionField: "AIR_CONDITIONING_WATTS",
  },
  ventilador: { icon: "Wind", distributionField: "AIR_CONDITIONING_WATTS" },
  "chuveiro elétrico": { icon: "Home", distributionField: "HEATING_WATTS" },
  "chuveiro eletrico": { icon: "Home", distributionField: "HEATING_WATTS" },
  lâmpada: { icon: "Lightbulb", distributionField: "LIGHTING_WATTS" },
  lampada: { icon: "Lightbulb", distributionField: "LIGHTING_WATTS" },
  televisão: { icon: "Monitor", distributionField: "NONE" },
  televisao: { icon: "Monitor", distributionField: "NONE" },
  tv: { icon: "Monitor", distributionField: "NONE" },
  computador: { icon: "Monitor", distributionField: "NONE" },
  videogame: { icon: "Monitor", distributionField: "NONE" },
  "máquina de lavar": { icon: "Home", distributionField: "NONE" },
  "maquina de lavar": { icon: "Home", distributionField: "NONE" },
  "micro-ondas": { icon: "Home", distributionField: "NONE" },
  microondas: { icon: "Home", distributionField: "NONE" },
  "air fryer": { icon: "Home", distributionField: "NONE" },
};

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function enrichAppliance(
  raw: {
    id: number;
    name: string;
    appliance_category: string;
    average_power_watts: number;
    average_daily_use_hours: number;
  },
): ApplianceType {
  const meta = METADATA_BY_NAME[normalizeName(raw.name)] ?? {
    icon: "HelpCircle",
    distributionField: "NONE",
  };
  return {
    id: String(raw.id),
    name: raw.name,
    mlCategory: raw.appliance_category,
    powerWatts: raw.average_power_watts,
    dailyUsageHours: raw.average_daily_use_hours,
    icon: meta.icon,
    distributionField: meta.distributionField,
  };
}
