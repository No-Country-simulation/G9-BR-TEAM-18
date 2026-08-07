import type { ErrorResponse } from "../../types";
import { ApiError } from "../../types";
import { authFetch, redirectToLogin } from "./client";

export interface PropertyResponse {
  id: number;
  alias: string;
  property_type: string;
  active: boolean;
  address?: string;
  resident_count?: number;
  area_sqm?: number;
}

export async function createProperty(
  alias: string,
  propertyType: string,
  address?: string,
  residentCount?: number,
  areaSqm?: number,
): Promise<PropertyResponse> {
  const response = await authFetch("/properties", {
    method: "POST",
    body: JSON.stringify({
      alias,
      property_type: propertyType,
      address: address || null,
      resident_count: residentCount || null,
      area_sqm: areaSqm || null,
    }),
  });

  if (!response.ok) {
    const err: ErrorResponse = await response.json();
    throw new ApiError(err.message ?? "Erro ao criar propriedade", err.fields ?? {});
  }

  return response.json();
}

export async function listProperties(): Promise<PropertyResponse[]> {
  const response = await authFetch("/properties");
  if (!response.ok) {
    if (response.status === 401) redirectToLogin();
    return [];
  }
  return response.json();
}

export async function updateProperty(
  propertyId: number,
  alias: string,
  propertyType: string,
  active: boolean,
  address?: string,
  residentCount?: number,
  areaSqm?: number,
): Promise<PropertyResponse> {
  const response = await authFetch(`/properties/${propertyId}`, {
    method: "PUT",
    body: JSON.stringify({
      alias,
      property_type: propertyType,
      active,
      address: address || null,
      resident_count: residentCount || null,
      area_sqm: areaSqm || null,
    }),
  });
  if (!response.ok) {
    const err: ErrorResponse = await response.json();
    throw new ApiError(err.message ?? "Erro ao atualizar propriedade", err.fields ?? {});
  }
  return response.json();
}

/**
 * Exclui um imóvel do usuário (F073). O backend já expõe
 * DELETE /properties/{propertyId} com ownership check (PropertyController).
 */
export async function deleteProperty(propertyId: number): Promise<void> {
  const response = await authFetch(`/properties/${propertyId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    if (response.status === 401) redirectToLogin();
    const err: ErrorResponse = await response.json();
    throw new ApiError(err.message ?? "Erro ao excluir imóvel", err.fields ?? {});
  }
}
