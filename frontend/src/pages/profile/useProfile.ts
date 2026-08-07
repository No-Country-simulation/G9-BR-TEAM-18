import { useState, useEffect, useMemo } from "react";
import type { NavigateFunction } from "react-router";
import type {
  ApplianceType,
  ApplianceItem,
  PropertyType,
  Regularity,
  AnalysisResponse,
  User,
} from "../../types";
import { ApiError, DEFAULT_PROPERTY_TYPES } from "../../types";
import {
  listProperties,
  createProperty,
  updateProperty,
  deleteProperty,
  listAppliances,
  fetchCategories,
  fetchContractInfo,
  fetchPreferences,
  updatePreferences,
  listPropertyAppliances,
  batchUpdateAppliances,
  analyzeEnergy,
  listAnalyses,
  type PropertyResponse,
} from "../../services/api";
import { computeApplianceCalc } from "./applianceCalc";
import type { LastAnalysisInfo } from "./AnalysisResult";

export function useProfile(user: User | null, navigate: NavigateFunction) {
  const [property, setProperty] = useState<PropertyResponse | null>(null);
  const [aliasInput, setAliasInput] = useState("");
  const [propertyType, setPropertyType] = useState<PropertyType>("RESIDENCIAL");
  const [propertyTypeOptions, setPropertyTypeOptions] =
    useState<PropertyType[]>(DEFAULT_PROPERTY_TYPES);
  const [address, setAddress] = useState("");
  const [residentCount, setResidentCount] = useState(1);
  const [areaSqm, setAreaSqm] = useState(50);
  const [peakHourUsage, setPeakHourUsage] = useState(false);
  const [highConsumptionHours, setHighConsumptionHours] = useState(6);
  const [selectedAppliances, setSelectedAppliances] = useState<ApplianceItem[]>([]);
  const [applianceTypes, setApplianceTypes] = useState<ApplianceType[]>([]);
  const [regularity, setRegularity] = useState<Regularity>("instantanea");

  // fetchCategories() são categorias de EFICIÊNCIA; servem de fallback de cor no badge.
  const [backendCategorySet, setBackendCategorySet] = useState<Set<string>>(new Set());

  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deletingProperty, setDeletingProperty] = useState(false);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [lastAnalysis, setLastAnalysis] = useState<LastAnalysisInfo | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    Promise.all([
      listAppliances(),
      listProperties(),
      fetchCategories(),
      fetchContractInfo(),
      fetchPreferences(),
    ])
      .then(([appls, props, cats, contractInfo, prefs]) => {
        if (cats.length > 0) setBackendCategorySet(new Set(cats));
        setApplianceTypes(appls);
        if (contractInfo.propertyTypes.length > 0) {
          setPropertyTypeOptions(contractInfo.propertyTypes as PropertyType[]);
        }
        // Preferências ANTES do branch de imóvel ativo (o return precoce pulava o setRegularity).
        if (prefs.regularity) {
          setRegularity(prefs.regularity as Regularity);
        }
        // F069 / ADR-0046: hábitos persistidos no usuário (B051)
        if (typeof prefs.peak_hour_usage === "boolean") {
          setPeakHourUsage(prefs.peak_hour_usage);
        }
        if (typeof prefs.high_consumption_hours === "number") {
          setHighConsumptionHours(prefs.high_consumption_hours);
        }
        const active = props.find((p) => p.active) ?? props[0] ?? null;
        if (active) {
          setProperty(active);
          setAliasInput(active.alias);
          setPropertyType(active.property_type as PropertyType);
          setAddress(active.address ?? "");
          setResidentCount(active.resident_count ?? 1);
          setAreaSqm(active.area_sqm ?? 50);
          return listPropertyAppliances(active.id).then((pa) => {
            setSelectedAppliances(
              pa.map((a) => ({ type: String(a.appliance_id), quantity: a.quantity })),
            );
          });
        }
      })
      .then(() => {
        return listAnalyses().then((all) => {
          if (all.length > 0) {
            const latest = all[all.length - 1];
            setLastAnalysis({
              category: latest.category,
              probability: latest.probability,
              cost: latest.estimated_monthly_cost,
              date: latest.created_at,
            });
          }
        });
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Erro ao carregar dados");
      })
      .finally(() => setLoading(false));
  }, [user, navigate]);

  const applianceCalc = useMemo(
    () => computeApplianceCalc(selectedAppliances, applianceTypes),
    [selectedAppliances, applianceTypes],
  );

  function addAppliance(id: string) {
    setSelectedAppliances((prev) => {
      const existing = prev.find((a) => a.type === id);
      if (existing) {
        return prev.map((a) => (a.type === id ? { ...a, quantity: a.quantity + 1 } : a));
      }
      return [...prev, { type: id, quantity: 1 }];
    });
  }

  function changeQuantity(typeId: string, delta: number) {
    setSelectedAppliances((prev) =>
      prev
        .map((a) => (a.type === typeId ? { ...a, quantity: Math.max(1, a.quantity + delta) } : a))
        .filter((a) => a.quantity > 0),
    );
  }

  function removeAppliance(typeId: string) {
    setSelectedAppliances((prev) => prev.filter((a) => a.type !== typeId));
  }

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
    property,
    aliasInput,
    setAliasInput,
    propertyType,
    setPropertyType,
    propertyTypeOptions,
    address,
    setAddress,
    residentCount,
    setResidentCount,
    areaSqm,
    setAreaSqm,
    peakHourUsage,
    setPeakHourUsage,
    highConsumptionHours,
    setHighConsumptionHours,
    selectedAppliances,
    applianceTypes,
    regularity,
    setRegularity,
    backendCategorySet,
    saving,
    analyzing,
    loading,
    error,
    confirmDelete,
    setConfirmDelete,
    deletingProperty,
    result,
    lastAnalysis,
    applianceCalc,
    addAppliance,
    changeQuantity,
    removeAppliance,
    handleSave,
    handleDeleteProperty,
    handleAnalyzeNow,
  };
}
