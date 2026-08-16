package br.com.group18.energiai.infrastructure.config;

import br.com.group18.energiai.application.services.ApplianceCatalogSyncService;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
public class CatalogSyncOnStartup {

    private final ApplianceCatalogSyncService catalogSyncService;

    public CatalogSyncOnStartup(ApplianceCatalogSyncService catalogSyncService) {
        this.catalogSyncService = catalogSyncService;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void syncCatalogOnStartup() {
        catalogSyncService.syncCatalog();
    }
}
