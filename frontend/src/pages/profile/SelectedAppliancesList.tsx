import type { ApplianceItem, ApplianceType } from "../../types";
import { LucideIcon } from "../../components/LucideIcon";

interface Props {
  selectedAppliances: ApplianceItem[];
  applianceTypes: ApplianceType[];
  totalEquipment: number;
  monthlyConsumptionKwh: number;
  onQtyChange: (typeId: string, delta: number) => void;
  onRemove: (typeId: string) => void;
}

export function SelectedAppliancesList({
  selectedAppliances,
  applianceTypes,
  totalEquipment,
  monthlyConsumptionKwh,
  onQtyChange,
  onRemove,
}: Props) {
  if (selectedAppliances.length === 0) {
    return (
      <p className="appliance-empty-hint">
        Clique nos aparelhos acima para adicioná-los ao seu perfil.
      </p>
    );
  }

  return (
    <div className="selected-appliances">
      <h4>Aparelhos adicionados</h4>
      <div className="selected-appliances-list">
        {selectedAppliances.map((item) => {
          const info = applianceTypes.find((t) => t.id === item.type);
          if (!info) return null;
          return (
            <div key={item.type} className="selected-appliance-item">
              <LucideIcon name={info.icon} size={16} className="selected-icon" />
              <span className="selected-name">{info.name}</span>
              <div className="selected-qty-controls">
                <button
                  type="button"
                  className="qty-btn"
                  onClick={() => onQtyChange(item.type, -1)}
                  disabled={item.quantity <= 1}
                  aria-label={`Reduzir quantidade de ${info.name}`}
                >
                  <LucideIcon name="Minus" size={14} />
                </button>
                <span className="qty-value">{item.quantity}</span>
                <button
                  type="button"
                  className="qty-btn"
                  onClick={() => onQtyChange(item.type, 1)}
                  aria-label={`Aumentar quantidade de ${info.name}`}
                >
                  <LucideIcon name="Plus" size={14} />
                </button>
              </div>
              <button
                type="button"
                className="remove-btn"
                onClick={() => onRemove(item.type)}
                aria-label={`Remover ${info.name} da lista`}
              >
                <LucideIcon name="Trash2" size={14} />
              </button>
            </div>
          );
        })}
      </div>
      <div className="appliance-summary">
        <div className="summary-stat">
          <span className="summary-label">Equipamentos</span>
          <span className="summary-value">{totalEquipment}</span>
        </div>
        <div className="summary-stat">
          <span className="summary-label">Consumo estimado</span>
          <span className="summary-value">{monthlyConsumptionKwh.toFixed(0)} kWh/mês</span>
        </div>
      </div>
    </div>
  );
}
