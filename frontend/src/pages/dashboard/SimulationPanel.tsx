import { useState } from "react";
import { ArrowDown, PiggyBank, Sparkles, AlertCircle } from "lucide-react";
import { simulateEnergy } from "../../services/api";
import type { PropertyResponse } from "../../services/api";
import type { AnalysisHistory, AnalysisResponse } from "../../types";
import { CATEGORY_COLORS, CATEGORY_DISPLAY } from "../../types";
import { AnalysisSourceBadge } from "../../components/AnalysisSourceBadge";
import { resolveApplianceIcon } from "../../data/appliance-icons";
import { LucideIcon } from "../../components/LucideIcon";

interface Props {
  property: PropertyResponse;
  lastAnalysis: AnalysisHistory;
  currentKwh: number;
}

export function SimulationPanel({ property, lastAnalysis, currentKwh }: Props) {
  const [simTargetKwh, setSimTargetKwh] = useState(0);
  const [simResult, setSimResult] = useState<AnalysisResponse | null>(null);
  const [simLoading, setSimLoading] = useState(false);
  const [simError, setSimError] = useState<string | null>(null);

  const handleSimulate = async () => {
    const target = simTargetKwh || Math.round(currentKwh * 0.85);
    if (target >= currentKwh) return;
    setSimLoading(true);
    setSimError(null);
    setSimResult(null);
    try {
      const res = await simulateEnergy(
        property.id,
        target,
        lastAnalysis.peak_hour_usage,
        lastAnalysis.high_consumption_hours,
        undefined,
      );
      setSimResult(res);
    } catch (err) {
      setSimError(err instanceof Error ? err.message : "Erro ao simular");
    } finally {
      setSimLoading(false);
    }
  };

  return (
    <div className="dash-section">
      <h3>
        <PiggyBank size={20} /> Simule sua Economia
      </h3>
      <p className="dash-section-subtitle">
        Informe um novo consumo para simular como sua classificacao mudaria com a reducao:
      </p>
      <div className="dash-sim-card">
        <div className="dash-sim-row">
          <div className="dash-sim-current">
            <span className="dash-sim-label">Atual</span>
            <span className="dash-sim-value">{currentKwh.toFixed(0)} kWh</span>
          </div>
          <div className="dash-sim-arrow">
            <ArrowDown size={20} />
          </div>
          <div className="dash-sim-target">
            <span className="dash-sim-label">Novo consumo</span>
            <div className="dash-sim-input-group">
              <input
                type="number"
                min={0}
                max={currentKwh}
                step={10}
                value={simTargetKwh || Math.round(currentKwh * 0.85)}
                onChange={(e) => {
                  setSimTargetKwh(Number(e.target.value));
                  setSimResult(null);
                  setSimError(null);
                }}
                className="dash-sim-input"
              />
              <span className="dash-sim-unit">kWh</span>
            </div>
          </div>
          <button
            className="dash-btn dash-btn--primary"
            onClick={handleSimulate}
            disabled={simLoading || (simTargetKwh || Math.round(currentKwh * 0.85)) >= currentKwh}
          >
            {simLoading ? (
              "Simulando..."
            ) : (
              <>
                <Sparkles size={16} /> Simular com IA
              </>
            )}
          </button>
        </div>

        {simError && (
          <div className="dash-sim-error">
            <AlertCircle size={14} />
            <span>{simError}</span>
          </div>
        )}

        {simResult && (
          <div className="dash-sim-result">
            <div className="dash-sim-result-header">
              <span
                className="dash-last-badge"
                style={{
                  backgroundColor:
                    CATEGORY_COLORS[simResult.category as keyof typeof CATEGORY_COLORS] ??
                    "#9ca3af",
                }}
              >
                {CATEGORY_DISPLAY[simResult.category as keyof typeof CATEGORY_DISPLAY] ??
                  simResult.category}
              </span>
              <span className="dash-sim-stat">
                Confianca: {(simResult.probability * 100).toFixed(0)}%
              </span>
              <span className="dash-sim-stat">
                Custo: R$ {simResult.estimated_monthly_cost.toFixed(2)}
              </span>
              <AnalysisSourceBadge source={simResult.source} />
            </div>
            {simResult.highest_consumption_products &&
              simResult.highest_consumption_products.length > 0 && (
                <div className="dash-sim-products">
                  <span className="dash-sim-products-label">Maiores consumidores:</span>
                  <span className="dash-sim-products-list">
                    {simResult.highest_consumption_products.map((product, i) => (
                      <span key={i} className="dash-sim-product-tag">
                        <LucideIcon
                          name={resolveApplianceIcon(product, "")}
                          size={14}
                          className="appliance-icon-inline"
                        />
                        {product}
                      </span>
                    ))}
                  </span>
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
}
