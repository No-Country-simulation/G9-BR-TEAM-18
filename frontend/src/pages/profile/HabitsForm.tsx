interface Props {
  peakHourUsage: boolean;
  onPeakHourUsageChange: (value: boolean) => void;
  highConsumptionHours: number;
  onHighConsumptionHoursChange: (value: number) => void;
}

export function HabitsForm({
  peakHourUsage,
  onPeakHourUsageChange,
  highConsumptionHours,
  onHighConsumptionHoursChange,
}: Props) {
  return (
    <>
      <h3 className="section-title">Hábitos de Consumo</h3>

      <div className="form-group">
        <label htmlFor="pico" className="checkbox-label">
          <input
            id="pico"
            type="checkbox"
            checked={peakHourUsage}
            onChange={(e) => onPeakHourUsageChange(e.target.checked)}
          />
          Uso em horário de pico (18h às 21h)
        </label>
      </div>

      <div className="form-group">
        <label htmlFor="horas-alto-consumo">Horas de alto consumo por dia</label>
        <input
          id="horas-alto-consumo"
          type="number"
          min="0"
          max="24"
          step="0.5"
          value={highConsumptionHours}
          onChange={(e) => onHighConsumptionHoursChange(Number(e.target.value))}
        />
      </div>
    </>
  );
}
