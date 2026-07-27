package br.com.group18.energiai.core.domain.model;

import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

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

    private static final Map<String, EquipmentCategory> LOOKUP = new HashMap<>();

    static {
        for (EquipmentCategory cat : values()) {
            LOOKUP.put(cat.portuguese.toLowerCase(Locale.ROOT), cat);
            // Also index the accent-free version for ML service compatibility
            String noAccent = cat.portuguese
                    .replaceAll("[áàâã]", "a")
                    .replaceAll("[éèê]", "e")
                    .replaceAll("[íì]", "i")
                    .replaceAll("[óòôõ]", "o")
                    .replaceAll("[úùû]", "u")
                    .replaceAll("[ç]", "c")
                    .toLowerCase(Locale.ROOT);
            LOOKUP.put(noAccent, cat);
        }
    }

    public static EquipmentCategory fromPortuguese(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String key = value.strip().toLowerCase(Locale.ROOT);
        // LOOKUP já contém versões com e sem acentos (populado no static initializer)
        return LOOKUP.get(key);
    }
}
