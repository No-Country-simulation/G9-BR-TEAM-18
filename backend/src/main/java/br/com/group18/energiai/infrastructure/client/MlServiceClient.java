package br.com.group18.energiai.infrastructure.client;

import java.time.Duration;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
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

    public MlPredictResponse predict(MlPredictRequest request) {
        try {
            return webClient
                    .post()
                    .uri("/predict")
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(MlPredictResponse.class)
                    .block(Duration.ofSeconds(45));
        } catch (Exception e) {
            log.warn(
                    "ML Service indisponível — timeout de 45s excedido ou conexão recusada em {}: {}",
                    mlServiceUrl,
                    e.getMessage());
            return null;
        }
    }

    public record MlPredictRequest(
            double consumption_kwh,
            boolean peak_hour_usage,
            int equipment_quantity,
            String property_type,
            double high_consumption_hours,
            String highest_consumption_category,
            DailyConsumptionDistribution daily_consumption_distribution) {}

    public record DailyConsumptionDistribution(
            @com.fasterxml.jackson.annotation.JsonProperty("REFRIGERATION_WATTS") double REFRIGERATION_WATTS,
            @com.fasterxml.jackson.annotation.JsonProperty("HEATING_WATTS") double HEATING_WATTS,
            @com.fasterxml.jackson.annotation.JsonProperty("AIR_CONDITIONING_WATTS") double AIR_CONDITIONING_WATTS,
            @com.fasterxml.jackson.annotation.JsonProperty("LIGHTING_WATTS") double LIGHTING_WATTS) {}

    public record MlPredictResponse(String category, double probability, List<String> recommendations, String source) {}
}
