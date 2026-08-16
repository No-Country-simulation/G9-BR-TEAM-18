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
import { DEFAULT_PROPERTY_TYPES } from "../../types";
import {
  listProperties,
  listAppliances,
  fetchCategories,
  fetchContractInfo,
  fetchPreferences,
  listPropertyAppliances,
  listAnalyses,
  type PropertyResponse,
} from "../../services/api";
import { computeApplianceCalc } from "./applianceCalc";
import { latestAnalysis } from "../../utils/analyses";
import type { LastAnalysisInfo } from "./AnalysisResult";

/**
 * Estado e carregamento do perfil: imóvel ativo, hábitos, catálogo de aparelhos,
 * preferências e a última análise (F076: a mais recente, GET /analyses retorna DESC).
 * As mutações (salvar/excluir/analisar) ficam no useProfile.
 */
export function useProfileState(user: User | null, navigate: NavigateFunction) {
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
          const latest = latestAnalysis(all);
          if (latest) {
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

  return {
    property,
    setProperty,
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
    setSelectedAppliances,
    applianceTypes,
    regularity,
    setRegularity,
    backendCategorySet,
    loading,
    error,
    setError,
    result,
    setResult,
    lastAnalysis,
    setLastAnalysis,
    applianceCalc,
    addAppliance,
    changeQuantity,
    removeAppliance,
  };
}
