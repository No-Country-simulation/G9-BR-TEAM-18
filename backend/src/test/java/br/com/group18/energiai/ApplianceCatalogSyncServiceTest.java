package br.com.group18.energiai;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import br.com.group18.energiai.application.services.ApplianceCatalogSyncService;
import br.com.group18.energiai.core.domain.model.Appliance;
import br.com.group18.energiai.core.domain.model.ApplianceCatalogItem;
import br.com.group18.energiai.core.ports.out.ApplianceRepositoryPort;
import br.com.group18.energiai.core.ports.out.MlContractPort;
import java.math.BigDecimal;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ApplianceCatalogSyncServiceTest {

    private static final Set<String> CATEGORIAS_VALIDAS_NO_BANCO =
            Set.of("Iluminação", "Refrigeração", "Climatização", "Eletrodomésticos", "Tecnologia", "Serviços");

    @Mock
    private MlContractPort mlContract;

    @Mock
    private ApplianceRepositoryPort applianceRepository;

    @InjectMocks
    private ApplianceCatalogSyncService syncService;

    @Test
    void shouldSkipSyncWhenMlCatalogIsEmpty() {
        when(mlContract.applianceCatalog()).thenReturn(List.of());

        assertDoesNotThrow(syncService::syncCatalog);

        verify(applianceRepository, never()).findAll();
        verify(applianceRepository, never()).save(any());
    }

    @Test
    void shouldCreateNewApplianceWithKnownPortugueseCategory() {
        when(mlContract.applianceCatalog())
                .thenReturn(List.of(new ApplianceCatalogItem("Fritadeira Elétrica", "APPLIANCES", 1500, 0.5)));
        when(applianceRepository.findAll()).thenReturn(List.of());

        syncService.syncCatalog();

        ArgumentCaptor<Appliance> captor = ArgumentCaptor.forClass(Appliance.class);
        verify(applianceRepository, times(1)).save(captor.capture());

        Appliance saved = captor.getValue();
        assertEquals("Fritadeira Elétrica", saved.getName());
        assertEquals("Eletrodomésticos", saved.getApplianceCategory());
        assertTrue(CATEGORIAS_VALIDAS_NO_BANCO.contains(saved.getApplianceCategory()));
    }

    @Test
    void shouldUpdateExistingApplianceWithKnownCategory() {
        Appliance existente =
                new Appliance(1L, "Geladeira", "Refrigeração", BigDecimal.valueOf(150), BigDecimal.valueOf(24));

        when(mlContract.applianceCatalog())
                .thenReturn(List.of(new ApplianceCatalogItem("Geladeira", "CLIMATE_CONTROL", 180, 20.0)));
        when(applianceRepository.findAll()).thenReturn(List.of(existente));

        syncService.syncCatalog();

        ArgumentCaptor<Appliance> captor = ArgumentCaptor.forClass(Appliance.class);
        verify(applianceRepository, times(1)).save(captor.capture());

        Appliance saved = captor.getValue();
        assertEquals("Climatização", saved.getApplianceCategory());
        assertEquals(0, BigDecimal.valueOf(180).compareTo(saved.getAveragePowerWatts()));
    }

    @Test
    void shouldLocalizeAccentedNamesWhenCreatingNewAppliance() {
        when(mlContract.applianceCatalog())
                .thenReturn(List.of(
                        new ApplianceCatalogItem("Fogao", "APPLIANCES", 1500, 1.0),
                        new ApplianceCatalogItem("Chuveiro eletrico", "APPLIANCES", 5500, 0.5),
                        new ApplianceCatalogItem("Bomba d'agua", "SERVICES", 750, 1.0)));
        when(applianceRepository.findAll()).thenReturn(List.of());

        syncService.syncCatalog();

        ArgumentCaptor<Appliance> captor = ArgumentCaptor.forClass(Appliance.class);
        verify(applianceRepository, times(3)).save(captor.capture());

        List<String> nomes =
                captor.getAllValues().stream().map(Appliance::getName).toList();
        assertTrue(nomes.contains("Fogão"));
        assertTrue(nomes.contains("Chuveiro Elétrico"));
        assertTrue(nomes.contains("Bomba d'Água"));
    }

    @Test
    void shouldKeepOriginalNameWhenNotInLocalizationMap() {
        when(mlContract.applianceCatalog())
                .thenReturn(List.of(new ApplianceCatalogItem("Freezer", "REFRIGERATION", 200, 24.0)));
        when(applianceRepository.findAll()).thenReturn(List.of());

        syncService.syncCatalog();

        ArgumentCaptor<Appliance> captor = ArgumentCaptor.forClass(Appliance.class);
        verify(applianceRepository, times(1)).save(captor.capture());
        assertEquals("Freezer", captor.getValue().getName());
    }

    @Test
    void shouldSkipUnknownCategoryOnNewApplianceWithoutBreakingStartup() {
        when(mlContract.applianceCatalog())
                .thenReturn(List.of(new ApplianceCatalogItem("Aparelho Alienígena", "SPACESHIP_PROPULSION", 300, 5.0)));
        when(applianceRepository.findAll()).thenReturn(List.of());

        assertDoesNotThrow(
                syncService::syncCatalog, "Categoria desconhecida em aparelho novo não pode derrubar o startup");

        verify(applianceRepository, never()).save(any());
    }

    @Test
    void shouldKeepPreviousCategoryOnExistingApplianceWithUnknownCategory() {
        Appliance existente =
                new Appliance(1L, "Geladeira", "Refrigeração", BigDecimal.valueOf(150), BigDecimal.valueOf(24));

        when(mlContract.applianceCatalog())
                .thenReturn(List.of(new ApplianceCatalogItem("Geladeira", "SPACESHIP_PROPULSION", 200, 22.0)));
        when(applianceRepository.findAll()).thenReturn(List.of(existente));

        assertDoesNotThrow(
                syncService::syncCatalog, "Categoria desconhecida em aparelho existente não pode derrubar o startup");

        ArgumentCaptor<Appliance> captor = ArgumentCaptor.forClass(Appliance.class);
        verify(applianceRepository, times(1)).save(captor.capture());

        Appliance saved = captor.getValue();
        assertEquals("Refrigeração", saved.getApplianceCategory());
        assertTrue(CATEGORIAS_VALIDAS_NO_BANCO.contains(saved.getApplianceCategory()));
        assertEquals(0, BigDecimal.valueOf(200).compareTo(saved.getAveragePowerWatts()));
    }

    @Test
    void shouldNeverPersistCategoryViolatingCheckConstraint() {
        Appliance existente =
                new Appliance(1L, "Geladeira", "Refrigeração", BigDecimal.valueOf(150), BigDecimal.valueOf(24));

        when(mlContract.applianceCatalog())
                .thenReturn(List.of(
                        new ApplianceCatalogItem("Geladeira", "REFRIGERATION", 150, 24.0),
                        new ApplianceCatalogItem("Ventilador de Teto", "CLIMATE_CONTROL", 70, 8.0),
                        new ApplianceCatalogItem("Categoria Futura Do ML", "SMART_GRID_V2", 50, 1.0)));
        when(applianceRepository.findAll()).thenReturn(List.of(existente));

        assertDoesNotThrow(syncService::syncCatalog);

        ArgumentCaptor<Appliance> captor = ArgumentCaptor.forClass(Appliance.class);
        verify(applianceRepository, times(2)).save(captor.capture());

        for (Appliance saved : captor.getAllValues()) {
            assertTrue(
                    CATEGORIAS_VALIDAS_NO_BANCO.contains(saved.getApplianceCategory()),
                    () -> "Categoria '" + saved.getApplianceCategory() + "' violaria chk_appliance_category");
        }
    }
}
