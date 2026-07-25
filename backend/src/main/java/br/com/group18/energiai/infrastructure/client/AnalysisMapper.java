package br.com.group18.energiai.infrastructure.client;

import br.com.group18.energiai.core.domain.model.MlResult;
import br.com.group18.energiai.core.domain.valueobject.EfficiencyCategory;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class AnalysisMapper {

    private static final Logger log = LoggerFactory.getLogger(AnalysisMapper.class);

    private final String categoryKey;
    private final String probabilityKey;
    private final String recommendationsKey;
    private final String sourceKey;

    public AnalysisMapper(
            @Value("${ML_OUTPUT_FIELD_CATEGORY}") String categoryKey,
            @Value("${ML_OUTPUT_FIELD_PROBABILITY}") String probabilityKey,
            @Value("${ML_OUTPUT_FIELD_RECOMMENDATIONS}") String recommendationsKey,
            @Value("${ML_OUTPUT_FIELD_SOURCE}") String sourceKey) {
        this.categoryKey = categoryKey;
        this.probabilityKey = probabilityKey;
        this.recommendationsKey = recommendationsKey;
        this.sourceKey = sourceKey;
    }

    public MlResult toMlResult(MlEnvelope envelope) {
        String category = extractString(envelope, categoryKey);
        double probability = extractDouble(envelope, probabilityKey);
        List<String> recommendations = extractStringList(envelope, recommendationsKey);
        String source =
                envelope.get(sourceKey) != null ? envelope.get(sourceKey).toString() : "";

        log.debug(
                "Mapped ML response: category='{}', probability={}, recommendations={}, source='{}'",
                category,
                probability,
                recommendations,
                source);

        try {
            return new MlResult(new EfficiencyCategory(category), probability, recommendations, source);
        } catch (IllegalArgumentException e) {
            throw new MlServiceUnavailableException("Resposta inválida do serviço de análise: " + e.getMessage());
        }
    }

    private String extractString(MlEnvelope envelope, String key) {
        Object value = envelope.get(key);
        if (value == null || (value instanceof String s && s.isBlank())) {
            throw new MlServiceUnavailableException("Campo '" + key + "' ausente ou vazio na resposta do ML Service.");
        }
        return value.toString();
    }

    private double extractDouble(MlEnvelope envelope, String key) {
        Object value = envelope.get(key);
        if (value == null) {
            throw new MlServiceUnavailableException("Campo '" + key + "' ausente na resposta do ML Service.");
        }
        if (value instanceof Number number) {
            return number.doubleValue();
        }
        try {
            return Double.parseDouble(value.toString());
        } catch (NumberFormatException e) {
            throw new MlServiceUnavailableException("Campo '" + key + "' não é um número válido: " + value);
        }
    }

    private List<String> extractStringList(MlEnvelope envelope, String key) {
        Object value = envelope.get(key);
        if (value == null) {
            return List.of();
        }
        if (value instanceof List<?> list) {
            return list.stream().map(Object::toString).toList();
        }
        return List.of(value.toString());
    }
}
