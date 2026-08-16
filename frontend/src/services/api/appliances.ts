import type { ApplianceType, ErrorResponse, PropertyAppliance } from "../../types";
import { ApiError } from "../../types";
import { enrichAppliance } from "../../data/appliances";
import type { ApplianceCatalogItem } from "../../data/appliances";
import { authFetch, redirectToLogin } from "./client";

export async function listPropertyAppliances(propertyId: number): Promise<PropertyAppliance[]> {
  const response = await authFetch(`/properties/${propertyId}/appliances`);
  if (!response.ok) {
    if (response.status === 401) redirectToLogin();
    return [];
  }
  return response.json();
}

export async function batchUpdateAppliances(
  propertyId: number,
  items: Array<{ appliance_id: number; quantity: number }>,
): Promise<PropertyAppliance[]> {
  const response = await authFetch(`/properties/${propertyId}/appliances/batch`, {
    method: "PUT",
    body: JSON.stringify(items),
  });
  if (!response.ok) {
    const err: ErrorResponse = await response.json();
    throw new ApiError(err.message ?? "Erro ao atualizar aparelhos", err.fields ?? {});
  }
  return response.json();
}

export async function listAppliances(): Promise<ApplianceType[]> {
  const response = await authFetch("/appliances");
  if (!response.ok) {
    if (response.status === 401) redirectToLogin();
    const err: ErrorResponse = await response.json();
    throw new Error(err.message ?? "Erro ao carregar catálogo de aparelhos");
  }
  const raw: ApplianceCatalogItem[] = await response.json();
  return raw.map(enrichAppliance);
}
