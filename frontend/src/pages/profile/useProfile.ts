import { useState } from "react";
import type { NavigateFunction } from "react-router";
import type { PropertyType, User } from "../../types";
import { ApiError } from "../../types";
import {
  createProperty,
  updateProperty,
  deleteProperty,
  listProperties,
  updatePreferences,
  listPropertyAppliances,
  batchUpdateAppliances,
  analyzeEnergy,
} from "../../services/api";
import { useProfileState } from "./useProfileState";

/**
 * Mutações do perfil: salvar imóvel+aparelhos+preferências, excluir imóvel e
 * executar análise. O estado e o carregamento ficam no useProfileState.
 */
export function useProfile(user: User | null, navigate: NavigateFunction) {
  const state = useProfileState(user, navigate);
  const {
    property,
    setProperty,
    aliasInput,
    setAliasInput,
    propertyType,
    setPropertyType,
    address,
    setAddress,
    residentCount,
    setResidentCount,
    areaSqm,
    setAreaSqm,
    peakHourUsage,
    highConsumptionHours,
    selectedAppliances,
    setSelectedAppliances,
    applianceTypes,
    regularity,
    setError,
    setResult,
    setLastAnalysis,
    applianceCalc,
  } = state;

  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [deletingProperty, setDeletingProperty] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      let prop = property;
      const aliasValue = aliasInput.trim() || "Meu Imóvel";
      if (prop) {
        prop = await updateProperty(
          prop.id,
          aliasValue,
          propertyType,
          true,
          address,
          residentCount,
          areaSqm,
        );
      } else {
        prop = await createProperty(aliasValue, propertyType, address, residentCount, areaSqm);
      }
      setProperty(prop);

      const batchItems = selectedAppliances
        .map((item) => {
          const appliance = applianceTypes.find((t) => t.id === item.type);
          return appliance ? { appliance_id: Number(appliance.id), quantity: item.quantity } : null;
        })
        .filter((x): x is { appliance_id: number; quantity: number } => x !== null);

      if (batchItems.length > 0) {
        await batchUpdateAppliances(prop.id, batchItems);
      }

      await updatePreferences({
        regularity,
        // F069 / ADR-0046: persistir hábitos no usuário
        peak_hour_usage: peakHourUsage,
        high_consumption_hours: highConsumptionHours,
      }).catch(() => {});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar perfil");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteProperty() {
    if (!property) return;
    setDeletingProperty(true);
    setError(null);
    try {
      await deleteProperty(property.id);
      const props = await listProperties();
      const next = props.find((p) => p.active) ?? props[0] ?? null;
      setProperty(next);
      if (next) {
        setAliasInput(next.alias);
        setPropertyType(next.property_type as PropertyType);
        setAddress(next.address ?? "");
        setResidentCount(next.resident_count ?? 1);
        setAreaSqm(next.area_sqm ?? 50);
        const pa = await listPropertyAppliances(next.id);
        setSelectedAppliances(
          pa.map((a) => ({ type: String(a.appliance_id), quantity: a.quantity })),
        );
      } else {
        // Reseta o formulário (evita criar imóvel com dados obsoletos do excluído)
        setAliasInput("");
        setPropertyType("RESIDENCIAL");
        setAddress("");
        setResidentCount(1);
        setAreaSqm(50);
        setSelectedAppliances([]);
      }
      setConfirmDelete(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir imóvel");
      setConfirmDelete(false);
    } finally {
      setDeletingProperty(false);
    }
  }

  async function handleAnalyzeNow() {
    if (!property) return;
    setAnalyzing(true);
    setError(null);
    setResult(null);
    try {
      const rawConsumption =
        selectedAppliances.length > 0 ? applianceCalc.monthlyConsumptionKwh : 300;
      const consumptionKwh = Number(rawConsumption.toFixed(2));
      const res = await analyzeEnergy(
        property.id,
        consumptionKwh,
        peakHourUsage,
        highConsumptionHours,
        applianceCalc.highestConsumptionCategory,
      );
      setResult(res);
      setLastAnalysis({
        category: res.category,
        probability: res.probability,
        cost: res.estimated_monthly_cost,
        date: new Date().toISOString(),
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro na análise");
    } finally {
      setAnalyzing(false);
    }
  }

  return {
    ...state,
    saving,
    analyzing,
    deletingProperty,
    confirmDelete,
    setConfirmDelete,
    handleSave,
    handleDeleteProperty,
    handleAnalyzeNow,
  };
}
