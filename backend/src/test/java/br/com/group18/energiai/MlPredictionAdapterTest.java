package br.com.group18.energiai;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import br.com.group18.energiai.application.exception.MlServiceUnavailableException;
import br.com.group18.energiai.core.domain.model.MlResult;
import br.com.group18.energiai.core.ports.out.PredictionInput;
import br.com.group18.energiai.infrastructure.client.AnalysisMapper;
import br.com.group18.energiai.infrastructure.client.MlEnvelope;
import br.com.group18.energiai.infrastructure.client.MlPredictionAdapter;
import br.com.group18.energiai.infrastructure.client.MlServiceClient;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class MlPredictionAdapterTest {

    private MlServiceClient mlServiceClient;
    private MlPredictionAdapter adapter;

    @BeforeEach
    void setUp() {
        mlServiceClient = mock(MlServiceClient.class);
        AnalysisMapper mapper = new AnalysisMapper("category", "probability", "recommendations", "source");
        adapter = new MlPredictionAdapter(mlServiceClient, mapper);
    }

    @Test
    void shouldReturnMappedResultWhenPredictionSucceeds() {
        when(mlServiceClient.predict(any(MlEnvelope.class)))
                .thenReturn(new MlEnvelope(Map.of(
                        "category",
                        "BOM",
                        "probability",
                        0.85,
                        "recommendations",
                        List.of("Reduza o uso no horário de pico"),
                        "source",
                        "model")));

        MlResult result = adapter.predict(input("REFRIGERATION", List.of("Geladeira")));

        assertEquals("BOM", result.category().value());
        assertEquals(0.85, result.probability());
        assertEquals("model", result.source());
        assertEquals(1, result.recommendations().size());
    }

    @Test
    void shouldThrowMlServiceUnavailableWhenPredictionReturnsNull() {
        when(mlServiceClient.predict(any(MlEnvelope.class))).thenReturn(null);

        assertThrows(MlServiceUnavailableException.class, () -> adapter.predict(input(null, null)));
    }

    @Test
    void shouldReturnMappedResultWhenSimulatedPredictionSucceeds() {
        when(mlServiceClient.predictSimulate(any(MlEnvelope.class)))
                .thenReturn(new MlEnvelope(Map.of(
                        "category", "CRITICO", "probability", 0.3, "recommendations", List.of(), "source", "groq")));

        MlResult result = adapter.predictSimulated(input(null, List.of()));

        assertEquals("CRITICO", result.category().value());
        assertEquals(0.3, result.probability());
        assertEquals("groq", result.source());
    }

    @Test
    void shouldThrowMlServiceUnavailableWhenSimulatedPredictionReturnsNull() {
        when(mlServiceClient.predictSimulate(any(MlEnvelope.class))).thenReturn(null);

        assertThrows(MlServiceUnavailableException.class, () -> adapter.predictSimulated(input(null, null)));
    }

    @Test
    void shouldIncludeHighestConsumptionFieldsInPredictionEnvelope() {
        when(mlServiceClient.predict(any(MlEnvelope.class)))
                .thenReturn(new MlEnvelope(Map.of("category", "BOM", "probability", 0.5)));

        adapter.predict(input("REFRIGERATION", List.of("Geladeira", "Ar Condicionado")));

        ArgumentCaptor<MlEnvelope> captor = ArgumentCaptor.forClass(MlEnvelope.class);
        verify(mlServiceClient).predict(captor.capture());

        Map<String, Object> body = captor.getValue().body();
        assertEquals("REFRIGERATION", body.get("highest_consumption_category"));
        assertEquals(List.of("Geladeira", "Ar Condicionado"), body.get("highest_consumption_products"));
        assertEquals("RESIDENCIAL", body.get("property_type"));
        assertEquals(300.5, body.get("consumption_kwh"));
    }

    @Test
    void shouldOmitHighestConsumptionFieldsWhenBlankOrEmpty() {
        when(mlServiceClient.predict(any(MlEnvelope.class)))
                .thenReturn(new MlEnvelope(Map.of("category", "BOM", "probability", 0.5)));

        adapter.predict(input("   ", List.of()));

        ArgumentCaptor<MlEnvelope> captor = ArgumentCaptor.forClass(MlEnvelope.class);
        verify(mlServiceClient).predict(captor.capture());

        Map<String, Object> body = captor.getValue().body();
        assertFalse(body.containsKey("highest_consumption_category"));
        assertFalse(body.containsKey("highest_consumption_products"));
    }

    @Test
    void shouldIncludePowerDistributionInPredictionEnvelope() {
        when(mlServiceClient.predict(any(MlEnvelope.class)))
                .thenReturn(new MlEnvelope(Map.of("category", "BOM", "probability", 0.5)));

        adapter.predict(input(null, null));

        ArgumentCaptor<MlEnvelope> captor = ArgumentCaptor.forClass(MlEnvelope.class);
        verify(mlServiceClient).predict(captor.capture());

        Object distribution = captor.getValue().body().get("daily_consumption_distribution");
        Map<?, ?> distributionMap = (Map<?, ?>) distribution;
        assertEquals(100.0, distributionMap.get("REFRIGERATION_WATTS"));
        assertEquals(200.0, distributionMap.get("HEATING_WATTS"));
        assertEquals(300.0, distributionMap.get("AIR_CONDITIONING_WATTS"));
        assertEquals(400.0, distributionMap.get("LIGHTING_WATTS"));
    }

    private PredictionInput input(String highestConsumptionCategory, List<String> highestConsumptionProducts) {
        return new PredictionInput(
                300.5,
                true,
                4,
                "RESIDENCIAL",
                5.0,
                new PredictionInput.PowerDistribution(100.0, 200.0, 300.0, 400.0),
                highestConsumptionCategory,
                highestConsumptionProducts);
    }
}
