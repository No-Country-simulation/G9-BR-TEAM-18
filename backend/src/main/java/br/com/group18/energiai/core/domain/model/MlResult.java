package br.com.group18.energiai.core.domain.model;

import br.com.group18.energiai.core.domain.valueobject.EfficiencyCategory;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

public record MlResult(EfficiencyCategory category, double probability, List<String> recommendations, String source) {

    private static final double MIN_PROBABILITY = 0.0;
    private static final double MAX_PROBABILITY = 1.0;

    public MlResult {
        Objects.requireNonNull(category, "category must not be null");
        Objects.requireNonNull(recommendations, "recommendations must not be null");

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
