package br.com.group18.energiai;

import static org.junit.jupiter.api.Assertions.*;

import br.com.group18.energiai.core.domain.model.MlResult;
import br.com.group18.energiai.infrastructure.client.AnalysisMapper;
import br.com.group18.energiai.infrastructure.client.MlEnvelope;
import br.com.group18.energiai.infrastructure.client.MlServiceUnavailableException;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class AnalysisMapperExtendedTest {

    private AnalysisMapper mapper;

    @BeforeEach
    void setUp() {
        mapper = new AnalysisMapper("category", "probability", "recommendations", "source");
    }

    @Test
    void shouldMapCompleteResponse() {
        MlEnvelope envelope = new MlEnvelope(Map.of(
                "category", "BOM",
                "probability", 0.85,
                "recommendations", List.of("Reduza o consumo", "Troque equipamentos"),
                "source", "model"));

        MlResult result = mapper.toMlResult(envelope);

        assertEquals("BOM", result.category().value());
        assertEquals(0.85, result.probability(), 0.001);
        assertEquals(2, result.recommendations().size());
        assertEquals("model", result.source());
    }

    @Test
    void shouldHandleEmptyRecommendations() {
        MlEnvelope envelope = new MlEnvelope(Map.of(
                "category", "EXCELENTE",
                "probability", 0.9,
                "recommendations", List.of(),
                "source", "model"));

        MlResult result = mapper.toMlResult(envelope);

        assertTrue(result.recommendations().isEmpty());
    }

    @Test
    void shouldHandleNullRecommendations() {
        MlEnvelope envelope = new MlEnvelope(Map.of(
                "category", "EXCELENTE",
                "probability", 0.9,
                "source", "model"));

        assertFalse(envelope.hasKey("recommendations"));
        MlResult result = mapper.toMlResult(envelope);

        assertTrue(result.recommendations().isEmpty());
    }

    @Test
    void shouldAcceptNumericProbabilityAsInteger() {
        MlEnvelope envelope = new MlEnvelope(Map.of(
                "category", "MEDIANO",
                "probability", 42,
                "recommendations", List.of("Cuidado"),
                "source", "rule-based"));

        MlResult result = mapper.toMlResult(envelope);

        assertEquals(42.0, result.probability(), 0.001);
    }

    @Test
    void shouldRejectProbabilityOutOfRange() {
        MlEnvelope envelope = new MlEnvelope(Map.of(
                "category", "BOM",
                "probability", -0.1,
                "recommendations", List.of("Teste")));

        assertThrows(MlServiceUnavailableException.class, () -> mapper.toMlResult(envelope));
    }

    @Test
    void shouldRejectProbabilityOverOne() {
        MlEnvelope envelope = new MlEnvelope(Map.of(
                "category", "BOM",
                "probability", 1.1,
                "recommendations", List.of("Teste")));

        assertThrows(MlServiceUnavailableException.class, () -> mapper.toMlResult(envelope));
    }

    @Test
    void shouldHandleBlankCategory() {
        MlEnvelope envelope = new MlEnvelope(Map.of(
                "category", "   ",
                "probability", 0.5,
                "recommendations", List.of("Teste")));

        assertThrows(MlServiceUnavailableException.class, () -> mapper.toMlResult(envelope));
    }

    @Test
    void shouldHandleMissingCategory() {
        MlEnvelope envelope = new MlEnvelope(Map.of(
                "probability", 0.5,
                "recommendations", List.of("Teste")));

        assertThrows(MlServiceUnavailableException.class, () -> mapper.toMlResult(envelope));
    }

    @Test
    void shouldHandleSingleStringRecommendation() {
        MlEnvelope envelope = new MlEnvelope(Map.of(
                "category", "CRITICO",
                "probability", 0.3,
                "recommendations", "Apenas uma recomendação",
                "source", "model"));

        MlResult result = mapper.toMlResult(envelope);

        assertEquals(1, result.recommendations().size());
        assertEquals("Apenas uma recomendação", result.recommendations().get(0));
    }

    @Test
    void shouldHandleEmptySource() {
        MlEnvelope envelope = new MlEnvelope(Map.of(
                "category", "BOM",
                "probability", 0.75,
                "recommendations", List.of("Ok")));

        MlResult result = mapper.toMlResult(envelope);

        assertEquals("", result.source());
    }

    @Test
    void shouldAcceptProbabilityAsStringNumber() {
        MlEnvelope envelope = new MlEnvelope(Map.of(
                "category", "EXCELENTE",
                "probability", "0.85",
                "recommendations", List.of("Bom trabalho!"),
                "source", "model"));

        MlResult result = mapper.toMlResult(envelope);

        assertEquals(0.85, result.probability(), 0.001);
    }

    @Test
    void shouldRejectNonNumericProbabilityString() {
        MlEnvelope envelope = new MlEnvelope(Map.of(
                "category", "EXCELENTE",
                "probability", "nao-e-numero",
                "recommendations", List.of("Teste")));

        assertThrows(MlServiceUnavailableException.class, () -> mapper.toMlResult(envelope));
    }

    @Test
    void shouldMapWithCustomKeys() {
        AnalysisMapper customMapper = new AnalysisMapper("cat", "prob", "recs", "src");

        MlEnvelope envelope = new MlEnvelope(Map.of(
                "cat", "RUIM",
                "prob", 0.4,
                "recs", List.of("Melhore!"),
                "src", "groq"));

        MlResult result = customMapper.toMlResult(envelope);

        assertEquals("RUIM", result.category().value());
        assertEquals(0.4, result.probability(), 0.001);
        assertEquals("groq", result.source());
    }

    @Test
    void shouldRejectInvalidCategoryWithCustomMapper() {
        AnalysisMapper customMapper = new AnalysisMapper("cat", "prob", "recs", "src");

        MlEnvelope envelope = new MlEnvelope(Map.of(
                "cat", "INVALIDO",
                "prob", 0.5,
                "recs", List.of("Teste")));

        assertThrows(MlServiceUnavailableException.class, () -> customMapper.toMlResult(envelope));
    }
}
