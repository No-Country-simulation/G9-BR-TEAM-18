package br.com.group18.energiai.application.services;

import br.com.group18.energiai.core.domain.model.Appliance;
import br.com.group18.energiai.core.domain.model.ApplianceCatalogItem;
import br.com.group18.energiai.core.domain.model.EquipmentCategory;
import br.com.group18.energiai.core.domain.util.ApplianceNameNormalizer;
import br.com.group18.energiai.core.ports.out.ApplianceRepositoryPort;
import br.com.group18.energiai.core.ports.out.MlContractPort;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ApplianceCatalogSyncService {

    private static final Logger log = LoggerFactory.getLogger(ApplianceCatalogSyncService.class);

    /**
     * Corrige nomes que o ML Service envia sem acentuação, preservando a grafia
     * em português usada no banco e exibida ao usuário final.
     */
    private static final Map<String, String> PT_BR_NAMES = Map.ofEntries(
            Map.entry("Lampada", "Lâmpada"),
            Map.entry("Ar-condicionado", "Ar-condicionado"),
            Map.entry("Air fryer", "Air Fryer"),
            Map.entry("Maquina de lavar", "Máquina de Lavar"),
            Map.entry("Chuveiro eletrico", "Chuveiro Elétrico"),
            Map.entry("Ferro de passar", "Ferro de Passar"),
            Map.entry("Fogao", "Fogão"),
            Map.entry("Televisao", "Televisão"),
            Map.entry("Bomba d'agua", "Bomba d'Água"),
            Map.entry("Portao eletrico", "Portão Elétrico"),
            Map.entry("Motor de piscina", "Motor de Piscina"));

    private final MlContractPort mlContract;
    private final ApplianceRepositoryPort applianceRepository;

    public ApplianceCatalogSyncService(MlContractPort mlContract, ApplianceRepositoryPort applianceRepository) {
        this.mlContract = mlContract;
        this.applianceRepository = applianceRepository;
    }

    public void syncCatalog() {
        log.info("Iniciando sincronização do catálogo de aparelhos do ML com o banco de dados...");

        List<ApplianceCatalogItem> catalog = mlContract.applianceCatalog();
        if (catalog == null || catalog.isEmpty()) {
            log.warn("Catálogo do ML Service está vazio. Sincronização ignorada.");
            return;
        }

        Map<String, Appliance> existingAppliancesByName = indexByName(applianceRepository.findAll());

        for (ApplianceCatalogItem mlAppliance : catalog) {
            Appliance existing = existingAppliancesByName.get(ApplianceNameNormalizer.normalize(mlAppliance.name()));
            Optional<EquipmentCategory> category = EquipmentCategory.fromEnglish(mlAppliance.category());

            if (existing != null) {
                updateExistingAppliance(existing, mlAppliance, category);
            } else if (category.isPresent()) {
                applianceRepository.save(createAppliance(mlAppliance, category.get()));
                log.info("Novo aparelho cadastrado via ML Sync: {}", mlAppliance.name());
            } else {
                log.warn(
                        "mlCategory '{}' desconhecida para o novo aparelho '{}'. Item pulado nesta"
                                + " sincronização (sem categoria anterior para preservar).",
                        mlAppliance.category(),
                        mlAppliance.name());
            }
        }

        log.info("Sincronização do catálogo concluída com sucesso!");
    }

    private Map<String, Appliance> indexByName(List<Appliance> appliances) {
        Map<String, Appliance> index = new HashMap<>();
        for (Appliance appliance : appliances) {
            index.put(ApplianceNameNormalizer.normalize(appliance.getName()), appliance);
        }
        return index;
    }

    private void updateExistingAppliance(
            Appliance existing, ApplianceCatalogItem mlAppliance, Optional<EquipmentCategory> category) {
        if (category.isPresent()) {
            existing.setApplianceCategory(category.get().toPortuguese());
        } else {
            log.warn(
                    "mlCategory '{}' desconhecida para o aparelho existente '{}'. Mantendo categoria anterior '{}'"
                            + " para não violar chk_appliance_category.",
                    mlAppliance.category(),
                    mlAppliance.name(),
                    existing.getApplianceCategory());
        }
        existing.setAveragePowerWatts(BigDecimal.valueOf(mlAppliance.watts()));
        existing.setAverageDailyUseHours(BigDecimal.valueOf(mlAppliance.hours()));
        applianceRepository.save(existing);
    }

    private Appliance createAppliance(ApplianceCatalogItem mlAppliance, EquipmentCategory category) {
        Appliance appliance = new Appliance();
        appliance.setName(localizedName(mlAppliance.name()));
        appliance.setApplianceCategory(category.toPortuguese());
        appliance.setAveragePowerWatts(BigDecimal.valueOf(mlAppliance.watts()));
        appliance.setAverageDailyUseHours(BigDecimal.valueOf(mlAppliance.hours()));
        return appliance;
    }

    private String localizedName(String mlName) {
        return PT_BR_NAMES.getOrDefault(mlName, mlName);
    }
}
