import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import type { ApplianceSnapshot } from "../../types";
import { resolveApplianceIcon } from "../../data/appliance-icons";
import { LucideIcon } from "../../components/LucideIcon";

function byMonthlyConsumption(a: ApplianceSnapshot, b: ApplianceSnapshot): number {
  return b.monthly_consumption_kwh - a.monthly_consumption_kwh;
}

export function ApplianceTable({ appliances }: { appliances: ApplianceSnapshot[] }) {
  if (!appliances.length) return null;

  const sorted = [...appliances].sort(byMonthlyConsumption);

  return (
    <div className="hist-table-section">
      <h4>
        <LucideIcon name="BarChart3" size={16} /> Detalhamento por Equipamento
      </h4>
      <div className="hist-table-wrapper">
        <table className="hist-table">
          <thead>
            <tr>
              <th className="hist-th-icon"></th>
              <th>Equipamento</th>
              <th>Qtd</th>
              <th>Potência (W)</th>
              <th>Uso/dia (h)</th>
              <th>kWh/mês</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((a, i) => (
              <tr key={i}>
                <td className="hist-td-icon">
                  <LucideIcon
                    name={resolveApplianceIcon(a.name, a.category)}
                    size={16}
                    className="appliance-icon-inline"
                  />
                </td>
                <td className="hist-td-name">{a.name}</td>
                <td>{a.quantity}</td>
                <td>{a.average_power_watts.toFixed(0)}</td>
                <td>{a.average_daily_use_hours.toFixed(1)}</td>
                <td className="hist-td-kwh">{a.monthly_consumption_kwh.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={5} className="hist-tfoot-label">
                Total
              </td>
              <td className="hist-td-kwh">
                {sorted.reduce((s, a) => s + a.monthly_consumption_kwh, 0).toFixed(1)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

export function ApplianceChart({ appliances }: { appliances: ApplianceSnapshot[] }) {
  if (!appliances.length) return null;

  const sorted = [...appliances].sort(byMonthlyConsumption);

  // Adiciona a quantidade ao nome para exibicao: "Geladeira x2"
  const chartData = sorted.map((a) => ({
    ...a,
    label: a.quantity > 1 ? `${a.name} x${a.quantity}` : a.name,
  }));

  return (
    <div className="hist-chart-section">
      <h4>
        <LucideIcon name="BarChart3" size={16} /> Consumo por Equipamento (kWh/mês)
      </h4>
      <ResponsiveContainer width="100%" height={Math.max(260, appliances.length * 48)}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 8, right: 16, bottom: 8, left: 160 }}
        >
          <XAxis
            type="number"
            tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={160}
            tick={{ fill: "var(--text-primary)", fontSize: 11 }}
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
              fontSize: "0.8rem",
            }}
            formatter={(_value: unknown) => {
              const v = typeof _value === "number" ? _value : 0;
              return [`${v.toFixed(1)} kWh/mês`, "Consumo"];
            }}
          />
          <Bar
            dataKey="monthly_consumption_kwh"
            fill="var(--accent-cyan)"
            radius={[0, 4, 4, 0]}
            barSize={24}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
