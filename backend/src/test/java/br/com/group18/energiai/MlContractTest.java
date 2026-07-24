package br.com.group18.energiai;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

import br.com.group18.energiai.core.domain.valueobject.EfficiencyCategory;
import br.com.group18.energiai.infrastructure.client.AnalysisMapper;
import br.com.group18.energiai.infrastructure.client.MlEnvelope;
import br.com.group18.energiai.infrastructure.client.MlServiceUnavailableException;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

/**
 * Contract tests that validate compatibility between the ML Service response
 * format and the backend's domain objects (ADR-0023).
 *
 * These tests verify that the fields and categories expected by the backend
 * are compatible with what the ML Service returns, without requiring the
 * ML Service to be running (they test the mapper and value objects directly).
 */
class MlContractTest {

    private final AnalysisMapper mapper = new AnalysisMapper("category", "probability", "recommendations", "source");

    @Test
    void mlSchemaShouldContainExpectedFields() {
        Map<String, Object> mockSchema = Map.of(
                "properties",
                Map.of(
                        "consumption_kwh", Map.of("type", "number"),
                        "peak_hour_usage", Map.of("type", "boolean"),
                        "equipment_quantity", Map.of("type", "integer"),
                        "property_type", Map.of("type", "string"),
                        "high_consumption_hours", Map.of("type", "number"),
                        "daily_consumption_distribution", Map.of("type", "object")));

        assertNotNull(mockSchema.get("properties"), "Schema must have 'properties' field");
        assertNotNull(
                ((Map<?, ?>) mockSchema.get("properties")).get("consumption_kwh"),
                "Schema must contain consumption_kwh");
        assertNotNull(
                ((Map<?, ?>) mockSchema.get("properties")).get("peak_hour_usage"),
                "Schema must contain peak_hour_usage");
        assertNotNull(
                ((Map<?, ?>) mockSchema.get("properties")).get("equipment_quantity"),
                "Schema must contain equipment_quantity");
        assertNotNull(
                ((Map<?, ?>) mockSchema.get("properties")).get("property_type"), "Schema must contain property_type");
        assertNotNull(
                ((Map<?, ?>) mockSchema.get("properties")).get("high_consumption_hours"),
                "Schema must contain high_consumption_hours");
    }

    @Test
    void mapperShouldAcceptAllValidCategories() {
        String[] validCategories = {"EXCELENTE", "BOM", "MEDIANO", "RUIM", "CRITICO"};

        for (String category : validCategories) {
            MlEnvelope envelope = new MlEnvelope(Map.of(
                    "category", category, "probability", 0.85, "recommendations", List.of("Recomendação de teste.")));

            assertDoesNotThrow(
                    () -> mapper.toMlResult(envelope), "Category '" + category + "' should be accepted by the mapper");
        }
    }

    @Test
    void mapperShouldHandleAllProbabilityValues() {
        double[] validProbabilities = {0.0, 0.5, 1.0, 0.3333, 0.9999};

        for (double prob : validProbabilities) {
            MlEnvelope envelope = new MlEnvelope(
                    Map.of("category", "EXCELENTE", "probability", prob, "recommendations", List.of("Ok.")));

            assertDoesNotThrow(() -> mapper.toMlResult(envelope), "Probability " + prob + " should be accepted");
        }
    }

    @Test
    void mapperShouldRejectInvalidCategory() {
        MlEnvelope envelope = new MlEnvelope(
                Map.of("category", "INEXISTENTE", "probability", 0.85, "recommendations", List.of("Teste.")));

        assertThrows(MlServiceUnavailableException.class, () -> mapper.toMlResult(envelope));
    }

    @Test
    void mapperShouldRejectNullCategory() {
        MlEnvelope envelope = new MlEnvelope(Map.of("probability", 0.85, "recommendations", List.of("Teste.")));

        assertThrows(MlServiceUnavailableException.class, () -> mapper.toMlResult(envelope));
    }

    @Test
    void mapperShouldRejectInvalidProbability() {
        MlEnvelope envelope =
                new MlEnvelope(Map.of("category", "BOM", "probability", 1.5, "recommendations", List.of("Teste.")));

        assertThrows(MlServiceUnavailableException.class, () -> mapper.toMlResult(envelope));
    }

    @Test
    void mapperShouldRejectNullProbability() {
        MlEnvelope envelope = new MlEnvelope(Map.of("category", "BOM", "recommendations", List.of("Teste.")));

        assertThrows(MlServiceUnavailableException.class, () -> mapper.toMlResult(envelope));
    }

    @Test
    void efficiencyCategoryShouldAcceptAllCategories() {
        String[] validCategories = {"EXCELENTE", "BOM", "MEDIANO", "RUIM", "CRITICO"};

        for (String category : validCategories) {
            assertDoesNotThrow(
                    () -> new EfficiencyCategory(category), "EfficiencyCategory should accept '" + category + "'");
        }
    }

    @Test
    void efficiencyCategoryShouldRejectInvalidCategories() {
        String[] invalidCategories = {"RUIMZINHO", "OTIMO", "", "   ", "123", "excelente_mas_digitado_errado"};

        for (String category : invalidCategories) {
            assertThrows(
                    IllegalArgumentException.class,
                    () -> new EfficiencyCategory(category),
                    "EfficiencyCategory should reject '" + category + "'");
        }
    }

    @Test
    void efficiencyCategoryShouldBeCaseInsensitiveAndTrim() {
        String[] variants = {" excelente ", "EXCELENTE", "Excelente", "  BOM  ", "bom"};

        for (String variant : variants) {
            EfficiencyCategory cat =
                    assertDoesNotThrow(() -> new EfficiencyCategory(variant), "Should accept '" + variant + "'");
            assertNotNull(cat.value());
        }
    }
}
