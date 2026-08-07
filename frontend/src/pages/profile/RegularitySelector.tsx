import type { Regularity } from "../../types";
import { REGULARITY_OPTIONS } from "../../types";
import { LucideIcon } from "../../components/LucideIcon";

interface Props {
  regularity: Regularity;
  onRegularityChange: (value: Regularity) => void;
}

export function RegularitySelector({ regularity, onRegularityChange }: Props) {
  return (
    <>
      <h3 className="section-title">Regularidade da Análise</h3>
      <p className="section-subtitle">
        Com que frequência você quer que a análise seja executada automaticamente?
      </p>
      <div className="regularity-selector">
        {REGULARITY_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={`regularity-option ${regularity === opt.value ? "active" : ""}`}
            onClick={() => onRegularityChange(opt.value)}
            aria-label={`Regularidade: ${opt.label}`}
          >
            {opt.value === "instantanea" && <LucideIcon name="Zap" size={16} />}
            {opt.value === "diaria" && <LucideIcon name="Sun" size={16} />}
            {opt.value === "semanal" && <LucideIcon name="Calendar" size={16} />}
            {opt.value === "mensal" && <LucideIcon name="CalendarDays" size={16} />}
            <span>{opt.label}</span>
          </button>
        ))}
      </div>
    </>
  );
}
