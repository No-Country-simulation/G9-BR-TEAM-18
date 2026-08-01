package br.com.group18.energiai.application.services;

import br.com.group18.energiai.core.domain.model.Appliance;
import br.com.group18.energiai.core.domain.util.ApplianceNameNormalizer;
import br.com.group18.energiai.core.ports.out.ApplianceRepositoryPort;
import br.com.group18.energiai.infrastructure.client.MlSchemaRegistry;
import br.com.group18.energiai.infrastructure.client.dto.MlApplianceDTO;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

@Service
public class ApplianceCatalogSyncService {

    private static final Logger log = LoggerFactory.getLogger(ApplianceCatalogSyncService.class);

    private final MlSchemaRegistry mlSchemaRegistry;
    private final ApplianceRepositoryPort applianceRepository;

    public ApplianceCatalogSyncService(MlSchemaRegistry mlSchemaRegistry, ApplianceRepositoryPort applianceRepository) {
        this.mlSchemaRegistry = mlSchemaRegistry;
        this.applianceRepository = applianceRepository;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void syncCatalogOnStartup() {
        log.info("Iniciando sincronização do catálogo de aparelhos do ML com o banco de dados...");

        List<MlApplianceDTO> catalog = mlSchemaRegistry.getApplianceCatalog();
        if (catalog == null || catalog.isEmpty()) {
            log.warn("Catálogo do ML Service está vazio. Sincronização ignorada.");
            return;
        }

        List<Appliance> existingAppliances = applianceRepository.findAll();

        Map<String, Appliance> dbApplianceMap = new HashMap<>();
        for (Appliance app : existingAppliances) {
            dbApplianceMap.put(ApplianceNameNormalizer.normalize(app.getName()), app);
        }

        for (MlApplianceDTO mlApp : catalog) {
            String normalizedMlName = ApplianceNameNormalizer.normalize(mlApp.name());
            Appliance appliance = dbApplianceMap.get(normalizedMlName);

            if (appliance != null) {
                appliance.setApplianceCategory(mlApp.mlCategory());
                appliance.setAveragePowerWatts(BigDecimal.valueOf(mlApp.watts()));
                appliance.setAverageDailyUseHours(BigDecimal.valueOf(mlApp.hours()));
                applianceRepository.save(appliance);
            } else {
                Appliance newAppliance = new Appliance();
                newAppliance.setName(mlApp.name());
                newAppliance.setApplianceCategory(mlApp.mlCategory());
                newAppliance.setAveragePowerWatts(BigDecimal.valueOf(mlApp.watts()));
                newAppliance.setAverageDailyUseHours(BigDecimal.valueOf(mlApp.hours()));

                applianceRepository.save(newAppliance);
                log.info("Novo aparelho cadastrado via ML Sync: {}", mlApp.name());
            }
        }

        log.info("Sincronização do catálogo concluída com sucesso!");
    }
}
