package br.com.group18.energiai;

import static org.junit.jupiter.api.Assertions.*;

import br.com.group18.energiai.application.services.EnergyAnalysisService;
import br.com.group18.energiai.core.domain.model.EnergyAnalysis;
import br.com.group18.energiai.core.ports.out.AnalysisRepositoryPort;
import br.com.group18.energiai.infrastructure.client.MlServiceClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class EnergyAnalysisServiceTest {

    private EnergyAnalysisService service;

    @BeforeEach
    void setUp() {
        AnalysisRepositoryPort repo = new AnalysisRepositoryPort() {
            private EnergyAnalysis saved;

            @Override
            public EnergyAnalysis save(EnergyAnalysis analysis) {
                this.saved = analysis;
                return analysis;
            }

            @Override
            public java.util.List<EnergyAnalysis> listAll() {
                return java.util.List.of(saved);
            }

            @Override
            public java.util.List<EnergyAnalysis> listByUserId(Long userId) {
                return saved != null && saved.getUserId().equals(userId)
                        ? java.util.List.of(saved)
                        : java.util.List.of();
            }
        };
        MlServiceClient mlClient = new MlServiceClient("http://localhost:9999");
        service = new EnergyAnalysisService(repo, mlClient);
    }

    @Test
    void shouldClassifyAsExcellent() {
        EnergyAnalysis r = service.execute(1L, 60.0, false, 3, "Casa", 1.0);
        assertEquals("EXCELENTE", r.getCategory());
    }

    @Test
    void shouldClassifyAsGood() {
        EnergyAnalysis r = service.execute(1L, 250.0, false, 8, "Casa", 3.0);
        assertEquals("BOM", r.getCategory());
    }

    @Test
    void shouldClassifyAsAverage() {
        EnergyAnalysis r = service.execute(1L, 500.0, false, 12, "Casa", 6.0);
        assertEquals("MEDIANO", r.getCategory());
    }

    @Test
    void shouldClassifyAsBad() {
        EnergyAnalysis r = service.execute(1L, 500.0, true, 12, "Casa", 6.0);
        assertEquals("RUIM", r.getCategory());
    }

    @Test
    void shouldClassifyAsCritical() {
        EnergyAnalysis r = service.execute(1L, 800.0, true, 20, "Casa", 10.0);
        assertEquals("CRITICO", r.getCategory());
    }

    @Test
    void shouldCalculateEstimatedCost() {
        EnergyAnalysis r = service.execute(1L, 200.0, false, 5, "Casa", 3.0);
        assertEquals(150.0, r.getEstimatedMonthlyCost(), 0.01);
    }

    @Test
    void shouldIncludePeakHourRecommendation() {
        EnergyAnalysis r = service.execute(1L, 200.0, true, 5, "Casa", 3.0);
        assertTrue(r.getRecommendations().stream().anyMatch(s -> s.contains("horários de pico")));
    }

    @Test
    void shouldIncludeRecommendationForBadOrCritical() {
        EnergyAnalysis r = service.execute(1L, 800.0, false, 15, "Casa", 8.0);
        assertTrue(r.getRecommendations().stream().anyMatch(s -> s.contains("equipamentos antigos")));
    }

    @Test
    void shouldIncludeRecommendationForManyAppliances() {
        EnergyAnalysis r = service.execute(1L, 200.0, false, 15, "Casa", 3.0);
        assertTrue(r.getRecommendations().stream().anyMatch(s -> s.contains("todos os equipamentos")));
    }

    @Test
    void shouldIncludeRecommendationForHighHours() {
        EnergyAnalysis r = service.execute(1L, 200.0, false, 5, "Casa", 6.0);
        assertTrue(r.getRecommendations().stream().anyMatch(s -> s.contains("Distribua")));
    }

    @Test
    void specificRecommendationForExcellent() {
        EnergyAnalysis r = service.execute(1L, 60.0, false, 2, "Casa", 1.0);
        assertTrue(r.getRecommendations().stream().anyMatch(s -> s.contains("boas práticas")));
    }

    @Test
    void defaultRecommendationWhenNoConditionMet() {
        EnergyAnalysis r = service.execute(1L, 250.0, false, 8, "Casa", 3.0);
        assertTrue(r.getRecommendations().stream().anyMatch(s -> s.contains("bom acompanhamento")));
    }
}
