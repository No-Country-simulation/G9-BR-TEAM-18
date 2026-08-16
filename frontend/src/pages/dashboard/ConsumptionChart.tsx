import { TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { LucideIcon } from "../../components/LucideIcon";
import { GRANULARITY_OPTIONS, type TimeGranularity } from "./helpers";

interface Props {
  data: { label: string; consumptionKwh: number }[];
  height: number;
  granularity: TimeGranularity;
  onGranularityChange: (granularity: TimeGranularity) => void;
}

export function ConsumptionChart({ data, height, granularity, onGranularityChange }: Props) {
  return (
    <div className="dash-chart">
      <div className="dash-chart-header">
        <h3>
          <TrendingUp size={20} /> Consumo (kWh)
        </h3>
        <div className="dash-granularity-tabs">
          {GRANULARITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`dash-gran-tab ${granularity === opt.value ? "dash-gran-tab--active" : ""}`}
              onClick={() => onGranularityChange(opt.value)}
            >
              <LucideIcon name={opt.icon} size={14} /> {opt.label}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data}>
          <XAxis
            dataKey="label"
            tick={{ fill: "var(--text-primary)", fontSize: 12, opacity: 0.7 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "var(--text-primary)", fontSize: 12, opacity: 0.7 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "var(--bg-surface-alt)" }}
            contentStyle={{
              background: "var(--bg-surface)",
              border: "1px solid var(--ink)",
              borderRadius: 8,
              color: "var(--text-primary)",
            }}
            formatter={(value: unknown) => {
              const v = typeof value === "number" ? value : 0;
              return [`${v.toFixed(1)} kWh`, "Consumo"];
            }}
          />
          <Bar dataKey="consumptionKwh" fill="var(--accent-green)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
