package br.com.group18.energiai;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import br.com.group18.energiai.core.domain.model.ApplianceSnapshot;
import br.com.group18.energiai.core.domain.model.EnergyAnalysis;
import br.com.group18.energiai.infrastructure.adapters.out.persistence.adapter.EnergyAnalysisRepositoryAdapter;
import br.com.group18.energiai.infrastructure.adapters.out.persistence.entity.AnalysisApplianceSnapshotEntity;
import br.com.group18.energiai.infrastructure.adapters.out.persistence.entity.EnergyAnalysisEntity;
import br.com.group18.energiai.infrastructure.adapters.out.persistence.mapper.EnergyAnalysisMapper;
import br.com.group18.energiai.infrastructure.adapters.out.persistence.repository.AnalysisApplianceSnapshotJpaRepository;
import br.com.group18.energiai.infrastructure.adapters.out.persistence.repository.AnalysisRecommendationJpaRepository;
import br.com.group18.energiai.infrastructure.adapters.out.persistence.repository.EnergyAnalysisJpaRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

/**
 * Testa a persistência transacional dos snapshots de aparelhos (Card B038 / Migration M005)
 * no EnergyAnalysisRepositoryAdapter: salvar em cascata no save(), reconstruir no findById()
 * e o batch fetch usado na listagem por propriedade.
 *
 * Usa a EnergyAnalysisMapper real (classe simples, sem dependências externas) e mocka apenas
 * os repositórios Spring Data JPA, seguindo o mesmo padrão do EnergyAnalysisServiceTest.
 */
class EnergyAnalysisRepositoryAdapterTest {

    private EnergyAnalysisJpaRepository analysisRepository;
    private AnalysisRecommendationJpaRepository recommendationRepository;
    private AnalysisApplianceSnapshotJpaRepository snapshotRepository;
    private EnergyAnalysisMapper mapper;
    private EnergyAnalysisRepositoryAdapter adapter;

    @BeforeEach
    void setUp() {
        analysisRepository = mock(EnergyAnalysisJpaRepository.class);
        recommendationRepository = mock(AnalysisRecommendationJpaRepository.class);
        snapshotRepository = mock(AnalysisApplianceSnapshotJpaRepository.class);
        mapper = new EnergyAnalysisMapper();

        adapter = new EnergyAnalysisRepositoryAdapter(
                analysisRepository, mapper, recommendationRepository, snapshotRepository);
    }

    @Test
    void deveSalvarSnapshotsDosAparelhosNaMesmaTransacaoDaAnalise() {
        EnergyAnalysis analysis = new EnergyAnalysis(1L, new BigDecimal("108.00"), true, new BigDecimal("6.50"));
        analysis.setPropertyType("RESIDENCIAL");
        analysis.setAppliancesSnapshot(List.of(new ApplianceSnapshot(
                "Geladeira", "REFRIGERATION", 1, new BigDecimal("150"), new BigDecimal("24"), new BigDecimal("108"))));

        EnergyAnalysisEntity savedEntity = new EnergyAnalysisEntity();
        savedEntity.setId(42L);
        when(analysisRepository.save(org.mockito.ArgumentMatchers.any(EnergyAnalysisEntity.class)))
                .thenReturn(savedEntity);

        adapter.save(analysis);

        verify(snapshotRepository).deleteByAnalysisId(42L);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<AnalysisApplianceSnapshotEntity>> captor = ArgumentCaptor.forClass(List.class);
        verify(snapshotRepository).saveAll(captor.capture());

        List<AnalysisApplianceSnapshotEntity> persistidos = captor.getValue();
        assertEquals(1, persistidos.size());
        assertEquals("Geladeira", persistidos.get(0).getApplianceName());
        assertEquals(42L, persistidos.get(0).getAnalysisId());
    }

    @Test
    void naoDeveChamarSaveAllQuandoNaoHaSnapshots() {
        EnergyAnalysis analysis = new EnergyAnalysis(1L, new BigDecimal("50.00"), false, new BigDecimal("0.00"));
        analysis.setPropertyType("COMERCIAL");
        // appliancesSnapshot fica vazio por padrão (ArrayList novo em EnergyAnalysis)

        EnergyAnalysisEntity savedEntity = new EnergyAnalysisEntity();
        savedEntity.setId(7L);
        when(analysisRepository.save(org.mockito.ArgumentMatchers.any(EnergyAnalysisEntity.class)))
                .thenReturn(savedEntity);

        adapter.save(analysis);

        verify(snapshotRepository).deleteByAnalysisId(7L);
        verify(snapshotRepository, never()).saveAll(anyList());
    }

    @Test
    void deveReconstruirSnapshotsAoBuscarAnalisePorId() {
        EnergyAnalysisEntity entity = new EnergyAnalysisEntity();
        entity.setId(10L);
        entity.setPropertyId(1L);
        entity.setConsumptionKwh(new BigDecimal("200.00"));
        entity.setPeakHourUsage(1);
        entity.setHighConsumptionHours(new BigDecimal("3.00"));
        when(analysisRepository.findById(10L)).thenReturn(Optional.of(entity));
        when(recommendationRepository.findByAnalysisIdIn(List.of(10L))).thenReturn(List.of());

        AnalysisApplianceSnapshotEntity snapshotEntity = new AnalysisApplianceSnapshotEntity(
                10L,
                "Ar-condicionado",
                "AIR_CONDITIONING",
                2,
                new BigDecimal("1200"),
                new BigDecimal("8"),
                new BigDecimal("576"));
        when(snapshotRepository.findByAnalysisIdIn(List.of(10L))).thenReturn(List.of(snapshotEntity));

        Optional<EnergyAnalysis> resultado = adapter.findById(10L);

        assertTrue(resultado.isPresent());
        List<ApplianceSnapshot> snapshots = resultado.get().getAppliancesSnapshot();
        assertEquals(1, snapshots.size());
        assertEquals("Ar-condicionado", snapshots.get(0).getApplianceName());
        assertEquals("AIR_CONDITIONING", snapshots.get(0).getApplianceCategory());
    }
}
