package br.com.group18.energiai;

import static org.junit.jupiter.api.Assertions.assertEquals;

import br.com.group18.energiai.infrastructure.adapters.out.persistence.entity.AnalysisApplianceSnapshotEntity;
import br.com.group18.energiai.infrastructure.adapters.out.persistence.entity.AnalysisRecommendationEntity;
import br.com.group18.energiai.infrastructure.adapters.out.persistence.entity.TokenBlacklistEntity;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import org.junit.jupiter.api.Test;

class PersistenceEntitiesTest {

    @Test
    void shouldExposeTokenBlacklistAccessors() {
        TokenBlacklistEntity entity = new TokenBlacklistEntity();
        entity.setId(1L);
        entity.setTokenHash("hash-abc");
        LocalDateTime expiresAt = LocalDateTime.of(2026, 8, 7, 23, 59);

        entity.setExpiresAt(expiresAt);

        assertEquals(1L, entity.getId());
        assertEquals("hash-abc", entity.getTokenHash());
        assertEquals(expiresAt, entity.getExpiresAt());
    }

    @Test
    void shouldExposeRecommendationAccessors() {
        AnalysisRecommendationEntity entity = new AnalysisRecommendationEntity(10L, "Reduza o consumo");

        assertEquals(10L, entity.getAnalysisId());
        assertEquals("Reduza o consumo", entity.getDescription());

        entity.setId(5L);
        entity.setAnalysisId(11L);
        entity.setDescription("Troque as lâmpadas");

        assertEquals(5L, entity.getId());
        assertEquals(11L, entity.getAnalysisId());
        assertEquals("Troque as lâmpadas", entity.getDescription());
    }

    @Test
    void shouldExposeApplianceSnapshotAccessors() {
        AnalysisApplianceSnapshotEntity entity = new AnalysisApplianceSnapshotEntity(
                10L,
                "Geladeira",
                "REFRIGERATION",
                2,
                new BigDecimal("150.00"),
                new BigDecimal("24.00"),
                new BigDecimal("108.00"));

        assertEquals(10L, entity.getAnalysisId());
        assertEquals("Geladeira", entity.getApplianceName());
        assertEquals("REFRIGERATION", entity.getApplianceCategory());
        assertEquals(2, entity.getQuantity());
        assertEquals(new BigDecimal("150.00"), entity.getAveragePowerWatts());
        assertEquals(new BigDecimal("24.00"), entity.getAverageDailyUseHours());
        assertEquals(new BigDecimal("108.00"), entity.getMonthlyConsumptionKwh());

        entity.setId(7L);
        entity.setQuantity(3);

        assertEquals(7L, entity.getId());
        assertEquals(3, entity.getQuantity());
    }
}
