import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/useAuth";
import {
  fetchDashboard,
  listAnalyses,
  fetchCategories,
  fetchPreferences,
  listProperties,
} from "../services/api";
import type { DashboardData, AnalysisHistory } from "../types";
import type { PropertyResponse } from "../services/api";
import { BarChart3, History, UserCog } from "lucide-react";
import {
  aggregateByGranularity,
  interpretTrend,
  CATEGORY_RANK,
  type TimeGranularity,
} from "./dashboard/helpers";
import { StatsCards } from "./dashboard/StatsCards";
import { GoalCard } from "./dashboard/GoalCard";
import { PropertySelector } from "./dashboard/PropertySelector";
import { SimulationPanel } from "./dashboard/SimulationPanel";
import { ConsumptionChart } from "./dashboard/ConsumptionChart";
import { LastAnalysisSection } from "./dashboard/LastAnalysisSection";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [chartHeight] = useState(() => (window.innerWidth < 480 ? 200 : 300));
  const [loading, setLoading] = useState(true);
  const [analyses, setAnalyses] = useState<AnalysisHistory[]>([]);
  const [goalKwh, setGoalKwh] = useState<number>(0);
  const [backendCategories, setBackendCategories] = useState<string[]>([]);
  const [granularity, setGranularity] = useState<TimeGranularity>("month");
  const [properties, setProperties] = useState<PropertyResponse[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);

  const selectedProperty = useMemo(
    () => properties.find((p) => p.id === selectedPropertyId) ?? properties[0] ?? null,
    [properties, selectedPropertyId],
  );

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    Promise.all([
      fetchDashboard(),
      listAnalyses(),
      fetchCategories(),
      fetchPreferences(),
      listProperties(),
    ])
      .then(([dash, allAnalyses, cats, prefs, props]) => {
        setData(dash);
        setAnalyses(allAnalyses);
        if (cats.length > 0) setBackendCategories(cats);
        if (prefs.consumption_goal) {
          setGoalKwh(prefs.consumption_goal);
        }
        setProperties(props);
        const active = props.find((p) => p.active) ?? props[0] ?? null;
        if (active) setSelectedPropertyId(active.id);
      })
      .finally(() => setLoading(false));
  }, [user, navigate]);

  const dynamicCategoryRank = useMemo(() => {
    if (backendCategories.length === 0) return CATEGORY_RANK;
    const dynamic: Record<string, number> = {};
    backendCategories.forEach((cat, idx) => {
      dynamic[cat] = idx;
    });
    return dynamic;
  }, [backendCategories]);

  const backendCategorySet = useMemo(() => new Set(backendCategories), [backendCategories]);

  const granularData = useMemo(
    () => aggregateByGranularity(analyses, granularity),
    [analyses, granularity],
  );

  if (loading) {
    return (
      <div className="dash-page" style={{ display: "flex", justifyContent: "center" }}>
        <p>Carregando dashboard...</p>
      </div>
    );
  }

  if (!data || data.totalAnalyses === 0) {
    return (
      <div className="dash-page" style={{ textAlign: "center" }}>
        <h1
          style={{
            marginBottom: "1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.75rem",
          }}
        >
          <BarChart3 size={28} /> Dashboard
        </h1>
        <div className="history-empty">
          <p>Nenhuma análise encontrada. Configure seu perfil e faça a primeira análise!</p>
          <div
            style={{ display: "flex", gap: "0.75rem", justifyContent: "center", marginTop: "1rem" }}
          >
            <button onClick={() => navigate("/profile")} className="dash-btn dash-btn--secondary">
              <UserCog size={18} /> Criar Perfil
            </button>
            <button onClick={() => navigate("/profile")} className="dash-btn dash-btn--primary">
              Fazer análise
            </button>
          </div>
        </div>
      </div>
    );
  }

  const lastAnalysis = analyses.length > 0 ? analyses[analyses.length - 1] : null;
  const trendInfo = interpretTrend(analyses);

  const recentCategories = analyses.slice(-2).map((a) => a.category);
  const rankDiff =
    analyses.length >= 2
      ? (dynamicCategoryRank[recentCategories[1]] ?? 999) -
        (dynamicCategoryRank[recentCategories[0]] ?? 999)
      : 0;

  const currentKwh = lastAnalysis?.consumption_kwh ?? data.averageConsumptionKwh;

  return (
    <div className="dash-page">
      <div className="dash-header">
        <h1>
          <BarChart3 size={28} /> Dashboard
        </h1>
        <div className="dash-actions">
          <button onClick={() => navigate("/history")} className="dash-btn dash-btn--secondary">
            <History size={18} /> Histórico
          </button>
        </div>
      </div>

      {lastAnalysis && (
        <LastAnalysisSection
          lastAnalysis={lastAnalysis}
          trendInfo={trendInfo}
          rankDiff={rankDiff}
          recentCategories={recentCategories}
          backendCategorySet={backendCategorySet}
        />
      )}

      <StatsCards data={data} />

      <GoalCard goalKwh={goalKwh} currentKwh={currentKwh} onChangeGoal={setGoalKwh} />

      {selectedProperty && properties.length > 1 && (
        <PropertySelector
          properties={properties}
          selectedPropertyId={selectedPropertyId}
          onSelect={(id) => {
            setSelectedPropertyId(id);
          }}
        />
      )}

      {selectedProperty && lastAnalysis && currentKwh > 0 && (
        <SimulationPanel
          key={selectedProperty.id}
          property={selectedProperty}
          lastAnalysis={lastAnalysis}
          currentKwh={currentKwh}
        />
      )}

      {granularData.length > 0 && (
        <ConsumptionChart
          data={granularData}
          height={chartHeight}
          granularity={granularity}
          onGranularityChange={setGranularity}
        />
      )}
    </div>
  );
}
