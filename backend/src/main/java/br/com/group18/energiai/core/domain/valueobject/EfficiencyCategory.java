package br.com.group18.energiai.core.domain.valueobject;

import com.fasterxml.jackson.annotation.JsonValue;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;

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

    @JsonValue
    public String toJson() {
        return value;
    }
}
