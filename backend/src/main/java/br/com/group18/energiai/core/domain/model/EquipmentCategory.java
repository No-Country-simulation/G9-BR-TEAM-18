package br.com.group18.energiai.core.domain.model;

import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

public enum EquipmentCategory {
    LIGHTING("Iluminação"),
    REFRIGERATION("Refrigeração"),
    CLIMATE_CONTROL("Climatização"),
    APPLIANCES("Eletrodomésticos"),
    TECHNOLOGY("Tecnologia"),
    SERVICES("Serviços");

    private final String portuguese;

    EquipmentCategory(String portuguese) {
        this.portuguese = portuguese;
    }

    public String toPortuguese() {
        return portuguese;
    }

    public static Optional<EquipmentCategory> fromEnglish(String englishValue) {
        if (englishValue == null || englishValue.isBlank()) {
            return Optional.empty();
        }
        String key = englishValue.strip().toUpperCase(Locale.ROOT);
        try {
            return Optional.of(EquipmentCategory.valueOf(key));
        } catch (IllegalArgumentException e) {
            return Optional.empty();
        }
    }

    public static String toPortugueseFromEnglish(String englishValue) {
        return fromEnglish(englishValue).map(EquipmentCategory::toPortuguese).orElse("Outros");
    }

    private static final Map<String, EquipmentCategory> LOOKUP = new HashMap<>();

    static {
        for (EquipmentCategory cat : values()) {
            LOOKUP.put(cat.portuguese.toLowerCase(Locale.ROOT), cat);
            String noAccent = cat.portuguese
                    .replaceAll("[áàâã]", "a")
                    .replaceAll("[éèê]", "e")
                    .replaceAll("[íì]", "i")
                    .replaceAll("[óòôõ]", "o")
                    .replaceAll("[úùû]", "u")
                    .replaceAll("ç", "c")
                    .toLowerCase(Locale.ROOT);
            LOOKUP.put(noAccent, cat);
        }
    }

    public static EquipmentCategory fromPortuguese(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String key = value.strip().toLowerCase(Locale.ROOT);
        return LOOKUP.get(key);
    }

    public static String toEnglishFromPortuguese(String portugueseValue) {
        EquipmentCategory category = fromPortuguese(portugueseValue);
        return category != null ? category.name() : portugueseValue;
    }
}
