package br.com.group18.energiai;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.RETURNS_DEEP_STUBS;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import br.com.group18.energiai.application.dto.EnergySimulationResult;
import br.com.group18.energiai.application.exception.InvalidRequestException;
import br.com.group18.energiai.application.exception.MlServiceUnavailableException;
import br.com.group18.energiai.application.services.ApplianceAggregationService;
import br.com.group18.energiai.application.services.EnergyAnalysisService;
import br.com.group18.energiai.core.domain.model.Appliance;
import br.com.group18.energiai.core.domain.model.ApplianceSnapshot;
import br.com.group18.energiai.core.domain.model.EnergyAnalysis;
import br.com.group18.energiai.core.domain.model.MlResult;
import br.com.group18.energiai.core.domain.model.Property;
import br.com.group18.energiai.core.domain.model.PropertyAppliance;
import br.com.group18.energiai.core.domain.valueobject.EfficiencyCategory;
import br.com.group18.energiai.core.ports.out.AnalysisRepositoryPort;
import br.com.group18.energiai.core.ports.out.EnergyPredictionPort;
import br.com.group18.energiai.core.ports.out.PredictionInput;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class EnergyAnalysisServiceTest {

    private AnalysisRepositoryPort repositoryMock;
    private EnergyPredictionPort predictionPortMock;
    private ApplianceAggregationService aggregationService;
    private EnergyAnalysisService service;

    @BeforeEach
    void setUp() {
        repositoryMock = mock(AnalysisRepositoryPort.class);
        predictionPortMock = mock(EnergyPredictionPort.class);
        aggregationService = mock(ApplianceAggregationService.class, RETURNS_DEEP_STUBS);

        service = new EnergyAnalysisService(
                repositoryMock, predictionPortMock, aggregationService, new BigDecimal("0.75"));
    }

    @Test
    void shouldCreateAnalysisWithSuccess() {
        Property property = new Property(1L, "Minha Casa", "RESIDENCIAL");
        Appliance geladeira =
                new Appliance(1L, "Geladeira", "Refrigeracao", new BigDecimal("150.0"), new BigDecimal("24.0"));
        PropertyAppliance propertyAppliance = new PropertyAppliance(1L, geladeira, 1);

        when(repositoryMock.save(any(EnergyAnalysis.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(predictionPortMock.predict(any(PredictionInput.class)))
                .thenReturn(
                        new MlResult(new EfficiencyCategory("EXCELENTE"), 0.95, List.of("Ótimo consumo."), "model"));

        EnergyAnalysis result = service.execute(
                property, List.of(propertyAppliance), new BigDecimal("108.0"), true, new BigDecimal("6.5"), null);

        assertNotNull(result);
        assertEquals("EXCELENTE", result.getCategory().value());
        assertEquals("CONCLUIDA", result.getStatus());
        assertEquals(new BigDecimal("108.00"), result.getConsumptionKwh());
    }

    @Test
    void shouldSaveAsFalhaAndThrowExceptionWhenMlServiceIsUnavailable() {
        Property property = new Property(1L, "Minha Casa", "RESIDENCIAL");
        Appliance geladeira =
                new Appliance(1L, "Geladeira", "Refrigeracao", new BigDecimal("150.0"), new BigDecimal("24.0"));
        PropertyAppliance propertyAppliance = new PropertyAppliance(1L, geladeira, 1);

        when(repositoryMock.save(any(EnergyAnalysis.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(predictionPortMock.predict(any(PredictionInput.class)))
                .thenThrow(new MlServiceUnavailableException(
                        "Serviço de análise temporariamente indisponível. Tente novamente em instantes."));

        MlServiceUnavailableException exception = assertThrows(
                MlServiceUnavailableException.class,
                () -> service.execute(
                        property,
                        List.of(propertyAppliance),
                        new BigDecimal("108.0"),
                        true,
                        new BigDecimal("6.5"),
                        null));

        assertEquals(
                "Serviço de análise temporariamente indisponível. Tente novamente em instantes.",
                exception.getMessage());

        ArgumentCaptor<EnergyAnalysis> analysisCaptor = ArgumentCaptor.forClass(EnergyAnalysis.class);
        verify(repositoryMock, times(2)).save(analysisCaptor.capture());

        assertEquals("FALHA", analysisCaptor.getValue().getStatus());
    }

    @Test
    void shouldFreezePropertyTypeAndApplianceSnapshotsBeforeFirstSave() {
        Property property = new Property(1L, "Minha Casa", "RESIDENCIAL");
        Appliance geladeira = new Appliance(
                1L, "Geladeira Frost Free", "REFRIGERATION", new BigDecimal("150.00"), new BigDecimal("24.00"));
        PropertyAppliance propertyAppliance = new PropertyAppliance(1L, geladeira, 1);

        when(repositoryMock.save(any(EnergyAnalysis.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(predictionPortMock.predict(any(PredictionInput.class)))
                .thenReturn(new MlResult(
                        new EfficiencyCategory("BOM"), 0.87, List.of("Reduza o uso no horário de pico"), "model"));

        service.execute(property, List.of(propertyAppliance), new BigDecimal("320.5"), true, new BigDecimal("4"), null);

        ArgumentCaptor<EnergyAnalysis> captor = ArgumentCaptor.forClass(EnergyAnalysis.class);
        verify(repositoryMock, times(2)).save(captor.capture());

        EnergyAnalysis primeiraChamada = captor.getAllValues().get(0);
        assertEquals("RESIDENCIAL", primeiraChamada.getPropertyType());
        assertEquals(1, primeiraChamada.getAppliancesSnapshot().size());

        ApplianceSnapshot snapshot = primeiraChamada.getAppliancesSnapshot().get(0);
        assertEquals("Geladeira Frost Free", snapshot.getApplianceName());
        assertEquals("REFRIGERATION", snapshot.getApplianceCategory());
        assertEquals(1, snapshot.getQuantity());
        assertEquals(new BigDecimal("150.00"), snapshot.getAveragePowerWatts());
        assertEquals(propertyAppliance.getMonthlyConsumptionKwh(), snapshot.getMonthlyConsumptionKwh());
    }

    @Test
    void shouldKeepSnapshotWhenMlServiceReturnsNullResponse() {
        Property property = new Property(1L, "Escritorio Central", "COMERCIAL");
        Appliance arCondicionado = new Appliance(
                2L, "Split 12000 BTU", "AIR_CONDITIONING", new BigDecimal("1200.00"), new BigDecimal("8.00"));
        PropertyAppliance propertyAppliance = new PropertyAppliance(1L, arCondicionado, 2);

        when(repositoryMock.save(any(EnergyAnalysis.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(predictionPortMock.predict(any(PredictionInput.class))).thenReturn(null);

        assertThrows(
                MlServiceUnavailableException.class,
                () -> service.execute(
                        property,
                        List.of(propertyAppliance),
                        new BigDecimal("600"),
                        false,
                        new BigDecimal("2"),
                        "AIR_CONDITIONING"));

        ArgumentCaptor<EnergyAnalysis> captor = ArgumentCaptor.forClass(EnergyAnalysis.class);
        verify(repositoryMock, times(2)).save(captor.capture());

        EnergyAnalysis salvoAposFalha = captor.getAllValues().get(1);
        assertEquals("FALHA", salvoAposFalha.getStatus());
        assertEquals("COMERCIAL", salvoAposFalha.getPropertyType());
        assertEquals(1, salvoAposFalha.getAppliancesSnapshot().size());
    }

    @Test
    void shouldGenerateEmptySnapshotsWhenPropertyHasNoAppliances() {
        Property property = new Property(1L, "Casa Vazia", "RESIDENCIAL");

        when(repositoryMock.save(any(EnergyAnalysis.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(predictionPortMock.predict(any(PredictionInput.class)))
                .thenReturn(new MlResult(new EfficiencyCategory("EXCELENTE"), 0.95, List.of(), "model"));

        service.execute(property, List.of(), new BigDecimal("100"), false, new BigDecimal("0"), null);

        ArgumentCaptor<EnergyAnalysis> captor = ArgumentCaptor.forClass(EnergyAnalysis.class);
        verify(repositoryMock, times(2)).save(captor.capture());
        assertTrue(captor.getAllValues().get(0).getAppliancesSnapshot().isEmpty());
    }

    @Test
    void shouldSendPropertyTypeWithoutTranslationToMlService() {
        Property property = new Property(1L, "Loja Comercial", "COMERCIAL");
        Appliance arCondicionado = new Appliance(
                1L, "Ar Condicionado", "AIR_CONDITIONING", new BigDecimal("1000.0"), new BigDecimal("8.0"));
        PropertyAppliance propertyAppliance = new PropertyAppliance(1L, arCondicionado, 1);

        when(repositoryMock.save(any(EnergyAnalysis.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(predictionPortMock.predict(any(PredictionInput.class)))
                .thenReturn(new MlResult(new EfficiencyCategory("EXCELENTE"), 0.90, List.of(), "model"));

        service.execute(
                property, List.of(propertyAppliance), new BigDecimal("250.0"), false, new BigDecimal("4.0"), null);

        ArgumentCaptor<PredictionInput> inputCaptor = ArgumentCaptor.forClass(PredictionInput.class);
        verify(predictionPortMock).predict(inputCaptor.capture());

        PredictionInput capturedInput = inputCaptor.getValue();
        assertNotNull(capturedInput);
        assertEquals("COMERCIAL", capturedInput.propertyType());
    }

    @Test
    void shouldThrowInvalidRequestWhenPropertyIsInactive() {
        Property inactiveProperty = new Property(1L, "Casa Inativa", "RESIDENCIAL");
        inactiveProperty.setActive(false);

        InvalidRequestException exception = assertThrows(
                InvalidRequestException.class,
                () -> service.execute(
                        inactiveProperty, List.of(), new BigDecimal("100"), false, new BigDecimal("0"), null));

        assertEquals("A propriedade está inativa e não pode receber análises.", exception.getMessage());
        verify(repositoryMock, never()).save(any(EnergyAnalysis.class));
    }

    @Test
    void shouldSimulateAnalysisWithoutPersistingAnything() {
        Property property = new Property(1L, "Minha Casa", "RESIDENCIAL");
        property.setId(7L);
        Appliance geladeira =
                new Appliance(1L, "Geladeira", "Refrigeracao", new BigDecimal("150.0"), new BigDecimal("24.0"));
        PropertyAppliance propertyAppliance = new PropertyAppliance(1L, geladeira, 1);

        when(predictionPortMock.predictSimulated(any(PredictionInput.class)))
                .thenReturn(
                        new MlResult(new EfficiencyCategory("EXCELENTE"), 0.95, List.of("Ótimo consumo."), "model"));

        EnergySimulationResult result = service.simulate(
                property, List.of(propertyAppliance), new BigDecimal("108.0"), true, new BigDecimal("6.5"), null);

        assertNotNull(result);
        assertEquals(7L, result.propertyId());
        assertEquals("EXCELENTE", result.category().value());
        assertEquals(0.95, result.probability().doubleValue());
        assertEquals("model", result.source());
        assertEquals(new BigDecimal("81.00"), result.estimatedMonthlyCost());
        assertEquals(1, result.appliances().size());
        verify(repositoryMock, never()).save(any(EnergyAnalysis.class));
    }

    @Test
    void shouldThrowMlServiceUnavailableWhenSimulationPredictionIsNull() {
        Property property = new Property(1L, "Minha Casa", "RESIDENCIAL");
        when(predictionPortMock.predictSimulated(any(PredictionInput.class))).thenReturn(null);

        assertThrows(
                MlServiceUnavailableException.class,
                () -> service.simulate(
                        property, List.of(), new BigDecimal("108.0"), true, new BigDecimal("6.5"), null));
    }
}
