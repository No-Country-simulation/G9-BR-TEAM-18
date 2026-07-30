package br.com.group18.energiai.infrastructure.client;

import br.com.group18.energiai.infrastructure.client.dto.MlApplianceCatalogResponse;
import br.com.group18.energiai.infrastructure.client.dto.MlContractResponse;
import java.time.Duration;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Component
public class MlServiceClient {

    private static final Logger log = LoggerFactory.getLogger(MlServiceClient.class);

    private final WebClient webClient;
    private final String mlServiceUrl;

    public MlServiceClient(@Value("${ML_SERVICE_URL}") String mlServiceUrl) {
        this.mlServiceUrl = mlServiceUrl;
        this.webClient = WebClient.builder().baseUrl(mlServiceUrl).build();
    }

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

    public MlEnvelope predictSimulate(MlEnvelope request) {
        try {
            Map<String, Object> responseBody = webClient
                    .post()
                    .uri("/predict/simulate")
                    .bodyValue(request.body())
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                    .block(Duration.ofSeconds(45));

            if (responseBody == null) {
                log.warn("ML Service /predict/simulate retornou corpo vazio em {}", mlServiceUrl);
                return null;
            }

            return new MlEnvelope(responseBody);

        } catch (Exception exception) {
            log.warn("ML Service /predict/simulate indisponível em {}: {}", mlServiceUrl, exception.getMessage());
            return null;
        }
    }

    public Mono<MlContractResponse> fetchContract() {
        return this.webClient.get()
                .uri("/contract")
                .retrieve()
                .bodyToMono(MlContractResponse.class)
                .doOnError(e -> log.warn("Failed to fetch contract from ML Service: {}", e.getMessage()));
    }

    public Mono<MlApplianceCatalogResponse> fetchApplianceCatalog() {
        return this.webClient.get()
                .uri("/appliance-catalog")
                .retrieve()
                .bodyToMono(MlApplianceCatalogResponse.class)
                .doOnError(e -> log.warn("Failed to fetch appliance catalog from ML Service: {}", e.getMessage()));
    }
}