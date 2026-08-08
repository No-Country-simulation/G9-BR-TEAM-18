package br.com.group18.energiai;

import static org.mockito.Mockito.verify;

import br.com.group18.energiai.application.services.ApplianceCatalogSyncService;
import br.com.group18.energiai.infrastructure.config.CatalogSyncOnStartup;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class CatalogSyncOnStartupTest {

    @Mock
    private ApplianceCatalogSyncService catalogSyncService;

    @InjectMocks
    private CatalogSyncOnStartup startup;

    @Test
    void shouldSyncCatalogWhenApplicationIsReady() {
        startup.syncCatalogOnStartup();

        verify(catalogSyncService).syncCatalog();
    }
}
