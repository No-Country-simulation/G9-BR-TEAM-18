package br.com.group18.energiai.core.domain.util;

import java.text.Normalizer;

public class ApplianceNameNormalizer {

    private ApplianceNameNormalizer() {}

    public static String normalize(String name) {
        if (name == null) {
            return "";
        }
        String lowerTrimmed = name.trim().toLowerCase();

        String normalized = Normalizer.normalize(lowerTrimmed, Normalizer.Form.NFD);
        return normalized.replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
    }
}
