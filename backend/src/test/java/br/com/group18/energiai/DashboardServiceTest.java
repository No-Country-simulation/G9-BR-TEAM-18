package br.com.group18.energiai;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import br.com.group18.energiai.application.dto.DashboardData;
import br.com.group18.energiai.application.dto.MonthlyConsumption;
import br.com.group18.energiai.application.services.DashboardService;
import br.com.group18.energiai.core.domain.model.EnergyAnalysis;
import br.com.group18.energiai.core.domain.model.Property;
import br.com.group18.energiai.core.ports.out.AnalysisRepositoryPort;
import br.com.group18.energiai.core.ports.out.PropertyRepositoryPort;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class DashboardServiceTest {

    private static final double CO2_EMISSION_FACTOR = 0.5;

    private PropertyRepositoryPort propertyRepository;
    private AnalysisRepositoryPort analysisRepository;
    private DashboardService service;

    @BeforeEach
    void setUp() {
        propertyRepository = mock(PropertyRepositoryPort.class);
        analysisRepository = mock(AnalysisRepositoryPort.class);
        service = new DashboardService(propertyRepository, analysisRepository, CO2_EMISSION_FACTOR);
    }

    @Test
    void shouldReturnZeroedDashboardWhenUserHasNoProperties() {
        when(propertyRepository.findByUserId(1L)).thenReturn(List.of());

        DashboardData data = service.build(1L);

        assertEquals(0, data.totalAnalyses());
        assertEquals(0.0, data.averageConsumptionKwh());
        assertEquals(0.0, data.totalEstimatedCost());
        assertEquals(0.0, data.totalCo2EmissionKg());
        assertTrue(data.monthlyConsumption().isEmpty());
    }

    @Test
    void shouldReturnZeroedDashboardWhenUserHasNoAnalyses() {
        Property property = property(10L);
        when(propertyRepository.findByUserId(1L)).thenReturn(List.of(property));
        when(analysisRepository.listByPropertyIds(List.of(10L))).thenReturn(List.of());

        DashboardData data = service.build(1L);

        assertEquals(0, data.totalAnalyses());
        assertEquals(0.0, data.averageConsumptionKwh());
        assertTrue(data.monthlyConsumption().isEmpty());
    }

    @Test
    void shouldAggregateAnalysesAcrossAllUserProperties() {
        Property first = property(10L);
        Property second = property(20L);
        when(propertyRepository.findByUserId(1L)).thenReturn(List.of(first, second));

        EnergyAnalysis julyAnalysis =
                analysis(10L, new BigDecimal("100.00"), new BigDecimal("75.00"), LocalDateTime.of(2026, 7, 10, 9, 0));
        EnergyAnalysis anotherJulyAnalysis =
                analysis(20L, new BigDecimal("200.00"), new BigDecimal("150.00"), LocalDateTime.of(2026, 7, 20, 9, 0));
        when(analysisRepository.listByPropertyIds(List.of(10L, 20L)))
                .thenReturn(List.of(julyAnalysis, anotherJulyAnalysis));

        DashboardData data = service.build(1L);

        assertEquals(2, data.totalAnalyses());
        assertEquals(150.0, data.averageConsumptionKwh());
        assertEquals(225.0, data.totalEstimatedCost());
        assertEquals(150.0, data.totalCo2EmissionKg());
        assertEquals(1, data.monthlyConsumption().size());
        MonthlyConsumption month = data.monthlyConsumption().get(0);
        assertTrue(month.month().endsWith("/2026"), "Rótulo do mês deve conter o ano");
        assertEquals(300.0, month.consumptionKwh());
    }

    @Test
    void shouldGroupAnalysesByMonth() {
        Property property = property(10L);
        when(propertyRepository.findByUserId(1L)).thenReturn(List.of(property));

        EnergyAnalysis juneAnalysis = analysis(10L, new BigDecimal("50.00"), null, LocalDateTime.of(2026, 6, 5, 9, 0));
        EnergyAnalysis julyAnalysis = analysis(10L, new BigDecimal("150.00"), null, LocalDateTime.of(2026, 7, 5, 9, 0));
        when(analysisRepository.listByPropertyIds(List.of(10L))).thenReturn(List.of(juneAnalysis, julyAnalysis));

        DashboardData data = service.build(1L);

        assertEquals(2, data.monthlyConsumption().size());
        assertEquals(50.0, data.monthlyConsumption().get(0).consumptionKwh());
        assertEquals(150.0, data.monthlyConsumption().get(1).consumptionKwh());
    }

    @Test
    void shouldExcludeNullConsumptionFromAveragesButKeepTotalCount() {
        Property property = property(10L);
        when(propertyRepository.findByUserId(1L)).thenReturn(List.of(property));

        EnergyAnalysis withoutConsumption =
                analysis(10L, null, new BigDecimal("10.00"), LocalDateTime.of(2026, 7, 5, 9, 0));
        when(analysisRepository.listByPropertyIds(List.of(10L))).thenReturn(List.of(withoutConsumption));

        DashboardData data = service.build(1L);

        assertEquals(1, data.totalAnalyses());
        assertEquals(0.0, data.averageConsumptionKwh());
        assertEquals(10.0, data.totalEstimatedCost());
        assertEquals(0.0, data.totalCo2EmissionKg());
    }

    @Test
    void shouldExcludeAnalysesWithoutCreatedAtFromMonthlyConsumption() {
        Property property = property(10L);
        when(propertyRepository.findByUserId(1L)).thenReturn(List.of(property));

        EnergyAnalysis withoutDate = analysis(10L, new BigDecimal("100.00"), null, null);
        when(analysisRepository.listByPropertyIds(List.of(10L))).thenReturn(List.of(withoutDate));

        DashboardData data = service.build(1L);

        assertEquals(1, data.totalAnalyses());
        assertTrue(data.monthlyConsumption().isEmpty());
    }

    private Property property(Long id) {
        Property property = new Property(1L, "Casa", "RESIDENCIAL");
        property.setId(id);
        return property;
    }

    private EnergyAnalysis analysis(
            Long propertyId, BigDecimal consumptionKwh, BigDecimal estimatedCost, LocalDateTime createdAt) {
        EnergyAnalysis analysis = new EnergyAnalysis(propertyId, consumptionKwh, false, new BigDecimal("0.00"));
        analysis.setEstimatedMonthlyCost(estimatedCost);
        analysis.setCreatedAt(createdAt);
        return analysis;
    }
}
