package br.com.group18.energiai;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import br.com.group18.energiai.application.services.ApplianceCatalogSyncService;
import br.com.group18.energiai.infrastructure.client.MlSchemaDiscovery;
import br.com.group18.energiai.infrastructure.client.MlSchemaRegistry;
import br.com.group18.energiai.infrastructure.client.MlServiceClient;
import br.com.group18.energiai.infrastructure.client.dto.MlApplianceCatalogResponse;
import br.com.group18.energiai.infrastructure.client.dto.MlApplianceDTO;
import br.com.group18.energiai.infrastructure.client.dto.MlContractResponse;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.ApplicationArguments;
import reactor.core.publisher.Mono;

@ExtendWith(MockitoExtension.class)
class MlSchemaDiscoveryTest {

    @Mock
    private MlServiceClient mlServiceClient;

    @Mock
    private ApplianceCatalogSyncService catalogSyncService;

    @Spy
    private MlSchemaRegistry registry = new MlSchemaRegistry(List.of("EXCELENTE", "BOM", "MEDIANO", "RUIM", "CRITICO"));

    @InjectMocks
    private MlSchemaDiscovery discovery;

    private ApplicationArguments mockArgs;

    @BeforeEach
    void setUp() {
        mockArgs = mock(ApplicationArguments.class);
    }

    @Test
    void shouldSaveDataToRegistryWhenMlServiceResponds() {
        MlContractResponse mockContract = new MlContractResponse(
                List.of("CASA_NA_ARVORE"), List.of("A", "B", "C"), List.of("ILUMINACAO_FUTURISTA"));

        MlApplianceCatalogResponse mockCatalog =
                new MlApplianceCatalogResponse(List.of(new MlApplianceDTO("Sabre de Luz", "TECNOLOGIA", 50, 2.0)));

        when(mlServiceClient.fetchContract()).thenReturn(Mono.just(mockContract));
        when(mlServiceClient.fetchApplianceCatalog()).thenReturn(Mono.just(mockCatalog));

        discovery.run(mockArgs);

        assertEquals(1, registry.propertyTypes().size());
        assertEquals("CASA_NA_ARVORE", registry.propertyTypes().get(0));

        assertEquals(1, registry.applianceCatalog().size());
        assertEquals("Sabre de Luz", registry.applianceCatalog().get(0).name());

        verify(registry, never()).loadDefaultValues();
        verify(catalogSyncService, never()).syncCatalog();
    }

    @Test
    void shouldLoadFallbackWhenMlServiceFailsOnStartup() {
        when(mlServiceClient.fetchContract()).thenReturn(Mono.error(new RuntimeException("Connection Refused")));
        when(mlServiceClient.fetchApplianceCatalog())
                .thenReturn(Mono.error(new RuntimeException("Connection Refused")));

        discovery.run(mockArgs);

        verify(registry, times(1)).loadDefaultValues();

        assertTrue(registry.propertyTypes().contains("RESIDENCIAL"));
        assertTrue(registry.propertyTypes().contains("COMERCIAL"));

        assertFalse(registry.applianceCatalog().isEmpty());
        assertEquals("Geladeira", registry.applianceCatalog().get(0).name());
    }
}
