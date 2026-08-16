import { TrendingUp, Zap, DollarSign, Leaf } from "lucide-react";
import type { DashboardData } from "../../types";

interface Props {
  data: DashboardData;
}

export function StatsCards({ data }: Props) {
  return (
    <div className="dash-grid">
      <div className="dash-card">
        <div className="dash-card-header">
          <TrendingUp size={20} className="dash-card-icon" />
          <span className="dash-card-label">Total de Análises</span>
        </div>
        <p className="dash-card-value">{data.totalAnalyses}</p>
      </div>

      <div className="dash-card">
        <div className="dash-card-header">
          <Zap size={20} className="dash-card-icon" />
          <span className="dash-card-label">Média de Consumo</span>
        </div>
        <p className="dash-card-value">
          {data.averageConsumptionKwh.toFixed(0)} <span className="dash-card-unit">kWh</span>
        </p>
      </div>

      <div className="dash-card">
        <div className="dash-card-header">
          <DollarSign size={20} className="dash-card-icon" />
          <span className="dash-card-label">Custo Total</span>
        </div>
        <p className="dash-card-value">R$ {data.totalEstimatedCost.toFixed(2)}</p>
      </div>

      <div className="dash-card">
        <div className="dash-card-header">
          <Leaf size={20} className="dash-card-icon" />
          <span className="dash-card-label">CO₂ Total</span>
        </div>
        <p className="dash-card-value">
          {data.totalCo2EmissionKg.toFixed(2)} <span className="dash-card-unit">kg</span>
        </p>
      </div>
    </div>
  );
}
