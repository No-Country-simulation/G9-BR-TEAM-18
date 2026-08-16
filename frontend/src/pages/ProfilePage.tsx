import { useNavigate } from "react-router";
import { useAuth } from "../context/useAuth";
import { LucideIcon } from "../components/LucideIcon";
import { PropertyForm } from "./profile/PropertyForm";
import { HabitsForm } from "./profile/HabitsForm";
import { ApplianceCatalog } from "./profile/ApplianceCatalog";
import { SelectedAppliancesList } from "./profile/SelectedAppliancesList";
import { RegularitySelector } from "./profile/RegularitySelector";
import { AnalysisResult } from "./profile/AnalysisResult";
import { DeletePropertyModal } from "./profile/DeletePropertyModal";
import { useProfile } from "./profile/useProfile";

export default function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const {
    property,
    aliasInput,
    setAliasInput,
    propertyType,
    setPropertyType,
    propertyTypeOptions,
    address,
    setAddress,
    residentCount,
    setResidentCount,
    areaSqm,
    setAreaSqm,
    peakHourUsage,
    setPeakHourUsage,
    highConsumptionHours,
    setHighConsumptionHours,
    selectedAppliances,
    applianceTypes,
    regularity,
    setRegularity,
    backendCategorySet,
    saving,
    analyzing,
    loading,
    error,
    confirmDelete,
    setConfirmDelete,
    deletingProperty,
    result,
    lastAnalysis,
    applianceCalc,
    addAppliance,
    changeQuantity,
    removeAppliance,
    handleSave,
    handleDeleteProperty,
    handleAnalyzeNow,
  } = useProfile(user, navigate);

  if (loading) {
    return (
      <div className="dash-page" style={{ display: "flex", justifyContent: "center" }}>
        <p>Carregando perfil...</p>
      </div>
    );
  }

  return (
    <>
      <div className="profile-page">
        <div className="profile-container">
          <div className="profile-header">
            <LucideIcon name="UserCog" size={28} />
            <h1>Meu Perfil</h1>
            <p>Configure seu tipo de residência e os aparelhos que você possui.</p>
          </div>

          {error && (
            <div className="profile-error">
              <LucideIcon name="AlertCircle" size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="profile-grid">
            <div className="profile-form">
              <PropertyForm
                aliasInput={aliasInput}
                onAliasChange={setAliasInput}
                propertyType={propertyType}
                onPropertyTypeChange={setPropertyType}
                propertyTypeOptions={propertyTypeOptions}
                address={address}
                onAddressChange={setAddress}
                residentCount={residentCount}
                onResidentCountChange={setResidentCount}
                areaSqm={areaSqm}
                onAreaSqmChange={setAreaSqm}
              />

              <HabitsForm
                peakHourUsage={peakHourUsage}
                onPeakHourUsageChange={setPeakHourUsage}
                highConsumptionHours={highConsumptionHours}
                onHighConsumptionHoursChange={setHighConsumptionHours}
              />

              <h3 className="section-title">
                Seus Aparelhos
                {selectedAppliances.length > 0 && (
                  <span className="appliance-count-badge">
                    {applianceCalc.totalEquipment} equip.
                  </span>
                )}
              </h3>
              <p className="section-subtitle">
                Adicione os aparelhos que você possui. Eles serão salvos no seu perfil.
              </p>

              <ApplianceCatalog
                applianceTypes={applianceTypes}
                selectedAppliances={selectedAppliances}
                onAdd={addAppliance}
              />

              <SelectedAppliancesList
                selectedAppliances={selectedAppliances}
                applianceTypes={applianceTypes}
                totalEquipment={applianceCalc.totalEquipment}
                monthlyConsumptionKwh={applianceCalc.monthlyConsumptionKwh}
                onQtyChange={changeQuantity}
                onRemove={removeAppliance}
              />

              <RegularitySelector regularity={regularity} onRegularityChange={setRegularity} />

              <button
                type="button"
                className="btn btn-primary btn-full"
                onClick={handleSave}
                disabled={saving}
                aria-label="Salvar perfil do imóvel"
              >
                {saving ? (
                  "Salvando..."
                ) : (
                  <>
                    <LucideIcon name="Save" size={18} /> Salvar Perfil
                  </>
                )}
              </button>

              {property && (
                <button
                  type="button"
                  className="btn btn-secondary btn-full"
                  onClick={handleAnalyzeNow}
                  disabled={analyzing || saving}
                  aria-label="Executar análise energética"
                  style={{ marginTop: "0.75rem" }}
                >
                  {analyzing ? (
                    "Analisando..."
                  ) : (
                    <>
                      <LucideIcon name="BarChart3" size={18} /> Analisar Agora
                    </>
                  )}
                </button>
              )}

              {property && (
                <button
                  type="button"
                  className="btn btn-danger btn-full"
                  onClick={() => setConfirmDelete(true)}
                  disabled={saving || analyzing || deletingProperty}
                  aria-label="Excluir imóvel"
                  style={{ marginTop: "0.75rem" }}
                >
                  <LucideIcon name="Trash2" size={18} /> Excluir Imóvel
                </button>
              )}

              <AnalysisResult
                analyzing={analyzing}
                result={result}
                lastAnalysis={lastAnalysis}
                backendCategorySet={backendCategorySet}
                onViewHistory={() => navigate("/history")}
              />
            </div>
          </div>
        </div>
      </div>

      {confirmDelete && property && (
        <DeletePropertyModal
          propertyAlias={property.alias}
          deleting={deletingProperty}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={handleDeleteProperty}
        />
      )}
    </>
  );
}
