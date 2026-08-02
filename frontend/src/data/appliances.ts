import type { ApplianceType } from "../types";
import { resolveApplianceIcon } from "./appliance-icons";

/**
 * Item do catálogo exposto pelo backend em GET /appliances (B050 / ADR-0027,
 * com id físico do banco desde a B052 / ADR-0048).
 *
 * Contrato atual (serialização SNAKE_CASE):
 *   { id, name, ml_category, watts, hours }
 *
 * Campos do contrato antigo (appliance_category, average_power_watts,
 * average_daily_use_hours) são aceitos como fallback defensivo para
 * compatibilidade durante a transição.
 */
export interface ApplianceCatalogItem {
  id?: number | string;
  name: string;
  ml_category?: string;
  appliance_category?: string;
  watts?: number;
  average_power_watts?: number;
  hours?: number;
  average_daily_use_hours?: number;
}

/**
 * Gera um id estável a partir do nome quando o contrato não expõe id.
 * Ex: "Televisão OLED" → "televisao-oled"
 */
function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Enriquece os dados crus do backend com o ícone Lucide apropriado.
 *
 * Usa resolveApplianceIcon() que busca por palavra-chave no nome
 * do aparelho (ex: "Geladeira Frost Free" → "Refrigerator").
 * Se não encontrar, usa fallback por mlCategory.
 */
export function enrichAppliance(raw: ApplianceCatalogItem): ApplianceType {
  const name = raw.name ?? "Aparelho";
  const mlCategory = raw.ml_category ?? raw.appliance_category ?? "OTHERS";
  const id = raw.id != null ? String(raw.id) : slugify(name);
  return {
    id,
    name,
    mlCategory,
    powerWatts: Number(raw.watts ?? raw.average_power_watts ?? 0),
    dailyUsageHours: Number(raw.hours ?? raw.average_daily_use_hours ?? 0),
    icon: resolveApplianceIcon(name, mlCategory),
  };
}
