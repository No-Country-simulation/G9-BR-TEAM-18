package br.com.group18.energiai.infrastructure.client;

import java.time.Duration;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

@Component
public class MlServiceClient {

    private static final Logger log = LoggerFactory.getLogger(MlServiceClient.class);

    private final WebClient webClient;
    private final String mlServiceUrl;

    public MlServiceClient(@Value("${ML_SERVICE_URL}") String mlServiceUrl) {
        this.mlServiceUrl = mlServiceUrl;
        this.webClient = WebClient.builder().baseUrl(mlServiceUrl).build();
    }

    /**
     * Sends a prediction request to the ML Service and returns a generic envelope.
     *
     * @param request the request data as a generic envelope
     * @return the response as a generic envelope, or {@code null} if unavailable
     */
    public MlEnvelope predict(MlEnvelope request) {
        try {
            Map<String, Object> responseBody = webClient
                    .post()
                    .uri("/predict")
                    .bodyValue(request.body())
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                    .block(Duration.ofSeconds(45));

            if (responseBody == null) {
                log.warn("ML Service retornou corpo vazio em {}", mlServiceUrl);
                return null;
            }

            return new MlEnvelope(responseBody);

        } catch (Exception exception) {
            log.warn("ML Service indisponível em {}: {}", mlServiceUrl, exception.getMessage());
            return null;
        }
    }

    /**
     * Fetches the JSON schema of the ML Service's PredictRequest model.
     *
     * @return the schema as a Map, or empty Map if unavailable
     */
    public Map<String, Object> fetchSchema() {
        try {
            Map<String, Object> schema = webClient
                    .get()
                    .uri("/predict-schema")
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                    .block(Duration.ofSeconds(10));

            return schema != null ? schema : Map.of();
        } catch (Exception e) {
            log.warn("Failed to fetch schema from ML Service: {}", e.getMessage());
            return Map.of();
        }
    }

    /**
     * Fetches the list of valid efficiency categories from the ML Service.
     *
     * @return the list of categories, or empty list if unavailable
     */
    public List<String> fetchCategories() {
        try {
            Map<String, Object> response = webClient
                    .get()
                    .uri("/categories")
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                    .block(Duration.ofSeconds(10));

            if (response != null && response.containsKey("categories")) {
                Object raw = response.get("categories");
                if (raw instanceof List<?> list) {
                    return list.stream().map(Object::toString).toList();
                }
            }
            return Collections.emptyList();
        } catch (Exception e) {
            log.warn("Failed to fetch categories from ML Service: {}", e.getMessage());
            return Collections.emptyList();
        }
    }
}
