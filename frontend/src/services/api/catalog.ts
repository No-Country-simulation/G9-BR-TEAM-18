import { authFetch, redirectToLogin } from "./client";

export interface ContractInfo {
  propertyTypes: string[];
  consumptionCategories: string[];
  efficiencyCategories: string[];
}

/**
 * Consome GET /contract-info (B050 / ADR-0027) para descobrir dinamicamente
 * os tipos de imóvel e categorias válidas expostos pelo ML Service.
 *
 * Nunca lança: em caso de falha/erro retorna listas vazias para que a página
 * use seu fallback local (F063).
 */
export async function fetchContractInfo(): Promise<ContractInfo> {
  try {
    const response = await authFetch("/contract-info");
    if (!response.ok) {
      if (response.status === 401) redirectToLogin();
      return { propertyTypes: [], consumptionCategories: [], efficiencyCategories: [] };
    }
    const raw = (await response.json()) as {
      property_types?: unknown;
      consumption_categories?: unknown;
      efficiency_categories?: unknown;
    };
    return {
      propertyTypes: Array.isArray(raw?.property_types) ? (raw.property_types as string[]) : [],
      consumptionCategories: Array.isArray(raw?.consumption_categories)
        ? (raw.consumption_categories as string[])
        : [],
      efficiencyCategories: Array.isArray(raw?.efficiency_categories)
        ? (raw.efficiency_categories as string[])
        : [],
    };
  } catch {
    return { propertyTypes: [], consumptionCategories: [], efficiencyCategories: [] };
  }
}
