package br.com.group18.energiai.infrastructure.client;

import br.com.group18.energiai.core.domain.model.MlResult;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Translates a generic {@link MlEnvelope} from the ML Service into a
 * domain {@link MlResult}. Field keys are configurable via application.properties
 * to absorb schema changes in the ML Service without code changes.
 */
@Component
public class AnalysisMapper {

    private static final Logger log = LoggerFactory.getLogger(AnalysisMapper.class);

    private final String categoryKey;
    private final String probabilityKey;
    private final String recommendationsKey;

    public AnalysisMapper(
            @Value("${ml.output.field.category:category}") String categoryKey,
            @Value("${ml.output.field.probability:probability}") String probabilityKey,
            @Value("${ml.output.field.recommendations:recommendations}") String recommendationsKey) {
        this.categoryKey = categoryKey;
        this.probabilityKey = probabilityKey;
        this.recommendationsKey = recommendationsKey;
    }

    /**
     * Converts an {@link MlEnvelope} received from the ML Service into a validated
     * {@link MlResult} domain object.
     *
     * @param envelope the raw response from the ML Service
     * @return a validated domain result
     * @throws MlServiceUnavailableException if required fields are missing or invalid
     */
    public MlResult toMlResult(MlEnvelope envelope) {
        String category = extractString(envelope, categoryKey);
        double probability = extractDouble(envelope, probabilityKey);
        List<String> recommendations = extractStringList(envelope, recommendationsKey);

        log.debug(
                "Mapped ML response: category='{}', probability={}, recommendations={}",
                category,
                probability,
                recommendations);

        try {
            return new MlResult(category, probability, recommendations);
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
