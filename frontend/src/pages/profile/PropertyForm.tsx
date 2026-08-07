import type { PropertyType } from "../../types";
import { PROPERTY_TYPE_LABELS } from "../../types";

interface Props {
  aliasInput: string;
  onAliasChange: (value: string) => void;
  propertyType: PropertyType;
  onPropertyTypeChange: (value: PropertyType) => void;
  propertyTypeOptions: PropertyType[];
  address: string;
  onAddressChange: (value: string) => void;
  residentCount: number;
  onResidentCountChange: (value: number) => void;
  areaSqm: number;
  onAreaSqmChange: (value: number) => void;
}

export function PropertyForm({
  aliasInput,
  onAliasChange,
  propertyType,
  onPropertyTypeChange,
  propertyTypeOptions,
  address,
  onAddressChange,
  residentCount,
  onResidentCountChange,
  areaSqm,
  onAreaSqmChange,
}: Props) {
  return (
    <>
      <h3 className="section-title">Dados do Imóvel</h3>

      <div className="form-group">
        <label>Nome do imóvel</label>
        <input
          type="text"
          placeholder="Ex: Casa, Apartamento"
          value={aliasInput}
          onChange={(e) => onAliasChange(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label>Tipo de imóvel</label>
        <select
          value={propertyType}
          onChange={(e) => onPropertyTypeChange(e.target.value as PropertyType)}
        >
          {propertyTypeOptions.map((t) => (
            <option key={t} value={t}>
              {PROPERTY_TYPE_LABELS[t as PropertyType] ?? t}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="endereco">Endereço</label>
        <input
          id="endereco"
          type="text"
          className="form-input"
          placeholder="Rua, número, bairro"
          value={address}
          onChange={(e) => onAddressChange(e.target.value)}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="moradores">Moradores</label>
          <input
            id="moradores"
            type="number"
            min="1"
            max="50"
            value={residentCount}
            onChange={(e) => onResidentCountChange(Math.max(1, Number(e.target.value)))}
          />
        </div>
        <div className="form-group">
          <label htmlFor="area">Área (m²)</label>
          <input
            id="area"
            type="number"
            min="10"
            max="99999"
            value={areaSqm}
            onChange={(e) => onAreaSqmChange(Math.max(10, Number(e.target.value)))}
          />
        </div>
      </div>
    </>
  );
}
