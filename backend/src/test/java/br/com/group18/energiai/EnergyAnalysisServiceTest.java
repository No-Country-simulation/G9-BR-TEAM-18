package br.com.group18.energiai;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.RETURNS_DEEP_STUBS;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import br.com.group18.energiai.application.services.ApplianceAggregationService;
import br.com.group18.energiai.application.services.EnergyAnalysisService;
import br.com.group18.energiai.core.domain.model.Appliance;
import br.com.group18.energiai.core.domain.model.EnergyAnalysis;
import br.com.group18.energiai.core.domain.model.Property;
import br.com.group18.energiai.core.domain.model.PropertyAppliance;
import br.com.group18.energiai.core.ports.out.AnalysisRepositoryPort;
import br.com.group18.energiai.infrastructure.client.AnalysisMapper;
import br.com.group18.energiai.infrastructure.client.MlEnvelope;
import br.com.group18.energiai.infrastructure.client.MlServiceClient;
import br.com.group18.energiai.infrastructure.client.MlServiceUnavailableException;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class EnergyAnalysisServiceTest {

    private AnalysisRepositoryPort repoMock;
    private MlServiceClient mlClientMock;
    private ApplianceAggregationService applianceAggregationService;
    private AnalysisMapper analysisMapper;
    private EnergyAnalysisService service;

    @BeforeEach
    void setUp() {
        repoMock = mock(AnalysisRepositoryPort.class);
        mlClientMock = mock(MlServiceClient.class);
        applianceAggregationService = mock(ApplianceAggregationService.class, RETURNS_DEEP_STUBS);
        analysisMapper = new AnalysisMapper("category", "probability", "recommendations");

        service = new EnergyAnalysisService(repoMock, mlClientMock, applianceAggregationService, analysisMapper);
    }

    @Test
    void shouldCreateAnalysisWithSuccess() {
        Property property = new Property(1L, "Minha Casa", "RESIDENCIAL");
        Appliance geladeira =
                new Appliance(1L, "Geladeira", "Refrigeracao", new BigDecimal("150.0"), new BigDecimal("24.0"));
        PropertyAppliance propertyAppliance = new PropertyAppliance(1L, geladeira, 1);

        when(repoMock.save(any(EnergyAnalysis.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Map<String, Object> responseBody =
                Map.of("category", "EXCELENTE", "probability", 0.95, "recommendations", List.of("Ótimo consumo."));
        when(mlClientMock.predict(any(MlEnvelope.class))).thenReturn(new MlEnvelope(responseBody));

        EnergyAnalysis result = service.execute(
                property, List.of(propertyAppliance), new BigDecimal("108.0"), true, new BigDecimal("6.5"));

        assertNotNull(result);
        assertEquals("EXCELENTE", result.getCategory());
        assertEquals("FINALIZADO", result.getStatus());
        assertEquals(new BigDecimal("108.00"), result.getConsumptionKwh());
    }

    @Test
    void shouldSaveAsFalhaAndThrowExceptionWhenMlServiceIsUnavailable() {
        Property property = new Property(1L, "Minha Casa", "RESIDENCIAL");
        Appliance geladeira =
                new Appliance(1L, "Geladeira", "Refrigeracao", new BigDecimal("150.0"), new BigDecimal("24.0"));
        PropertyAppliance propertyAppliance = new PropertyAppliance(1L, geladeira, 1);

        when(repoMock.save(any(EnergyAnalysis.class))).thenAnswer(invocation -> invocation.getArgument(0));

        when(mlClientMock.predict(any(MlEnvelope.class)))
                .thenThrow(new MlServiceUnavailableException(
                        "Serviço de análise temporariamente indisponível. Tente novamente em instantes."));

        MlServiceUnavailableException exception = assertThrows(
                MlServiceUnavailableException.class,
                () -> service.execute(
                        property, List.of(propertyAppliance), new BigDecimal("108.0"), true, new BigDecimal("6.5")));

        assertEquals(
                "Serviço de análise temporariamente indisponível. Tente novamente em instantes.",
                exception.getMessage());

        ArgumentCaptor<EnergyAnalysis> analysisCaptor = ArgumentCaptor.forClass(EnergyAnalysis.class);
        verify(repoMock, times(2)).save(analysisCaptor.capture());

        assertEquals("FALHA", analysisCaptor.getValue().getStatus());
    }
}
