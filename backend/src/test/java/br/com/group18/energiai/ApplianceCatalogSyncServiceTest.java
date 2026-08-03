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
import br.com.group18.energiai.core.ports.out.ApplianceRepositoryPort;
import br.com.group18.energiai.infrastructure.client.MlSchemaRegistry;
import br.com.group18.energiai.infrastructure.client.dto.MlApplianceDTO;
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
    private MlSchemaRegistry mlSchemaRegistry;

    @Mock
    private ApplianceRepositoryPort applianceRepository;

    @InjectMocks
    private ApplianceCatalogSyncService syncService;

    @Test
    void deveIgnorarSincronizacaoQuandoCatalogoDoMlEstaVazio() {
        when(mlSchemaRegistry.getApplianceCatalog()).thenReturn(List.of());

        assertDoesNotThrow(syncService::syncCatalogOnStartup);

        verify(applianceRepository, never()).findAll();
        verify(applianceRepository, never()).save(any());
    }

    @Test
    void deveCriarAparelhoNovoComCategoriaConhecidaJaEmPortugues() {
        when(mlSchemaRegistry.getApplianceCatalog())
                .thenReturn(List.of(new MlApplianceDTO("Fritadeira Elétrica", "APPLIANCES", 1500, 0.5)));
        when(applianceRepository.findAll()).thenReturn(List.of());

        syncService.syncCatalogOnStartup();

        ArgumentCaptor<Appliance> captor = ArgumentCaptor.forClass(Appliance.class);
        verify(applianceRepository, times(1)).save(captor.capture());

        Appliance saved = captor.getValue();
        assertEquals("Fritadeira Elétrica", saved.getName());
        assertEquals("Eletrodomésticos", saved.getApplianceCategory());
        assertTrue(CATEGORIAS_VALIDAS_NO_BANCO.contains(saved.getApplianceCategory()));
    }

    @Test
    void deveAtualizarAparelhoExistenteComCategoriaConhecida() {
        Appliance existente =
                new Appliance(1L, "Geladeira", "Refrigeração", BigDecimal.valueOf(150), BigDecimal.valueOf(24));

        when(mlSchemaRegistry.getApplianceCatalog())
                .thenReturn(List.of(new MlApplianceDTO("Geladeira", "CLIMATE_CONTROL", 180, 20.0)));
        when(applianceRepository.findAll()).thenReturn(List.of(existente));

        syncService.syncCatalogOnStartup();

        ArgumentCaptor<Appliance> captor = ArgumentCaptor.forClass(Appliance.class);
        verify(applianceRepository, times(1)).save(captor.capture());

        Appliance saved = captor.getValue();
        assertEquals("Climatização", saved.getApplianceCategory());
        assertEquals(0, BigDecimal.valueOf(180).compareTo(saved.getAveragePowerWatts()));
    }

    @Test
    void categoriaDesconhecidaEmAparelhoNovoDevePularSemQuebrarOStartup() {
        when(mlSchemaRegistry.getApplianceCatalog())
                .thenReturn(List.of(new MlApplianceDTO("Aparelho Alienígena", "SPACESHIP_PROPULSION", 300, 5.0)));
        when(applianceRepository.findAll()).thenReturn(List.of());

        assertDoesNotThrow(
                syncService::syncCatalogOnStartup,
                "Categoria desconhecida em aparelho novo não pode derrubar o startup");

        verify(applianceRepository, never()).save(any());
    }

    @Test
    void categoriaDesconhecidaEmAparelhoExistenteDeveManterCategoriaAnteriorSemQuebrarOStartup() {
        Appliance existente =
                new Appliance(1L, "Geladeira", "Refrigeração", BigDecimal.valueOf(150), BigDecimal.valueOf(24));

        when(mlSchemaRegistry.getApplianceCatalog())
                .thenReturn(List.of(new MlApplianceDTO("Geladeira", "SPACESHIP_PROPULSION", 200, 22.0)));
        when(applianceRepository.findAll()).thenReturn(List.of(existente));

        assertDoesNotThrow(
                syncService::syncCatalogOnStartup,
                "Categoria desconhecida em aparelho existente não pode derrubar o startup");

        ArgumentCaptor<Appliance> captor = ArgumentCaptor.forClass(Appliance.class);
        verify(applianceRepository, times(1)).save(captor.capture());

        Appliance saved = captor.getValue();
        assertEquals("Refrigeração", saved.getApplianceCategory());
        assertTrue(CATEGORIAS_VALIDAS_NO_BANCO.contains(saved.getApplianceCategory()));
        assertEquals(0, BigDecimal.valueOf(200).compareTo(saved.getAveragePowerWatts()));
    }

    @Test
    void nenhumaCategoriaPersistidaDeveViolarChkApplianceCategory() {
        Appliance existente =
                new Appliance(1L, "Geladeira", "Refrigeração", BigDecimal.valueOf(150), BigDecimal.valueOf(24));

        when(mlSchemaRegistry.getApplianceCatalog())
                .thenReturn(List.of(
                        new MlApplianceDTO("Geladeira", "REFRIGERATION", 150, 24.0),
                        new MlApplianceDTO("Ventilador de Teto", "CLIMATE_CONTROL", 70, 8.0),
                        new MlApplianceDTO("Categoria Futura Do ML", "SMART_GRID_V2", 50, 1.0)));
        when(applianceRepository.findAll()).thenReturn(List.of(existente));

        assertDoesNotThrow(syncService::syncCatalogOnStartup);

        ArgumentCaptor<Appliance> captor = ArgumentCaptor.forClass(Appliance.class);
        verify(applianceRepository, times(2)).save(captor.capture());

        for (Appliance saved : captor.getAllValues()) {
            assertTrue(
                    CATEGORIAS_VALIDAS_NO_BANCO.contains(saved.getApplianceCategory()),
                    () -> "Categoria '" + saved.getApplianceCategory() + "' violaria chk_appliance_category");
        }
    }
}
