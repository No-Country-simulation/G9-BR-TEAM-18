import type { ApplianceType } from "../types";
import { resolveApplianceIcon } from "./appliance-icons";

/**
 * Enriquece os dados crus do backend com o ícone Lucide apropriado.
 *
 * Usa resolveApplianceIcon() que busca por palavra-chave no nome
 * do aparelho (ex: "Geladeira Frost Free" → "Refrigerator").
 * Se não encontrar, usa fallback por mlCategory.
 */
export function enrichAppliance(raw: {
  id: number;
  name: string;
  appliance_category: string;
  average_power_watts: number;
  average_daily_use_hours: number;
}): ApplianceType {
  return {
    id: String(raw.id),
    name: raw.name,
    mlCategory: raw.appliance_category,
    powerWatts: raw.average_power_watts,
    dailyUsageHours: raw.average_daily_use_hours,
    icon: resolveApplianceIcon(raw.name, raw.appliance_category),
  };
}
