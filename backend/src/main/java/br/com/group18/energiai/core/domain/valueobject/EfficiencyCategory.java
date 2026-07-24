package br.com.group18.energiai.core.domain.valueobject;

import com.fasterxml.jackson.annotation.JsonValue;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;

/**
 * Value object representing an energy efficiency classification category.
 * Validates against the known set of valid categories at construction time.
 */
public record EfficiencyCategory(String value) {

    private static final Set<String> VALID = Set.of("EXCELENTE", "BOM", "MEDIANO", "RUIM", "CRITICO");

    public EfficiencyCategory {
        Objects.requireNonNull(value, "category must not be null");
        String normalized = value.strip().toUpperCase(Locale.ROOT);
        if (!VALID.contains(normalized)) {
            throw new IllegalArgumentException("Invalid category: '" + value + "'. Valid values: " + VALID);
        }
        value = normalized;
    }

    /**
     * Jackson serializer: serializes the EfficiencyCategory as its string value.
     */
    @JsonValue
    public String toJson() {
        return value;
    }
}
