import type { PropertyResponse } from "../../services/api";

interface Props {
  properties: PropertyResponse[];
  selectedPropertyId: number | null;
  onSelect: (id: number) => void;
}

export function PropertySelector({ properties, selectedPropertyId, onSelect }: Props) {
  return (
    <div className="property-selector">
      <span className="property-selector-label">Simular para:</span>
      <div className="property-selector-row">
        {properties.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`property-selector-btn ${selectedPropertyId === p.id ? "active" : ""}`}
            onClick={() => onSelect(p.id)}
          >
            <span className="property-selector-name">{p.alias}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
