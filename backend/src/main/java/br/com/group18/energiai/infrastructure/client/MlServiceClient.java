package br.com.group18.energiai.infrastructure.client;

import java.time.Duration;
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

    public MlServiceClient(@Value("${ml.service.url:http://localhost:8000}") String mlServiceUrl) {
        this.mlServiceUrl = mlServiceUrl;
        this.webClient = WebClient.builder().baseUrl(mlServiceUrl).build();
    }

    /**
     * Sends a prediction request to the ML Service and returns a generic envelope.
     * The envelope decouples the backend from the ML Service's exact JSON schema.
     *
     * @param request the request data as a generic envelope
     * @return the response as a generic envelope, or {@code null} if the ML Service is unavailable
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
}
