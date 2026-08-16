package br.com.group18.energiai.infrastructure.config;

import br.com.group18.energiai.application.services.ApplianceCatalogSyncService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class CatalogSyncScheduler {

    private static final Logger log = LoggerFactory.getLogger(CatalogSyncScheduler.class);

    private final ApplianceCatalogSyncService catalogSyncService;

    public CatalogSyncScheduler(ApplianceCatalogSyncService catalogSyncService) {
        this.catalogSyncService = catalogSyncService;
    }

    @Scheduled(cron = "0 0 */6 * * *")
    public void syncCatalogPeriodically() {
        log.info("Re-sincronização periódica do catálogo de aparelhos com o ML Service...");
        catalogSyncService.syncCatalog();
    }
}
