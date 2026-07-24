package br.com.group18.energiai.core.domain.model;

import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;

/**
 * Domain value object representing the result of an ML Service analysis.
 * Decouples the domain from the ML Service's response schema.
 */
public record MlResult(String category, double probability, List<String> recommendations) {

    private static final Set<String> VALID_CATEGORIES = Set.of("EXCELENTE", "BOM", "MEDIANO", "RUIM", "CRITICO");

    private static final double MIN_PROBABILITY = 0.0;
    private static final double MAX_PROBABILITY = 1.0;

    public MlResult {
        Objects.requireNonNull(category, "category must not be null");
        Objects.requireNonNull(recommendations, "recommendations must not be null");

        String normalized = category.strip().toUpperCase(Locale.ROOT);
        if (!VALID_CATEGORIES.contains(normalized)) {
            throw new IllegalArgumentException(
                    "Invalid category: '" + category + "'. Valid values: " + VALID_CATEGORIES);
        }

        if (Double.isNaN(probability)
                || Double.isInfinite(probability)
                || probability < MIN_PROBABILITY
                || probability > MAX_PROBABILITY) {
            throw new IllegalArgumentException("Probability must be between " + MIN_PROBABILITY + " and "
                    + MAX_PROBABILITY + ", got: " + probability);
        }

        recommendations = Collections.unmodifiableList(recommendations);
    }
}
