package br.com.group18.energiai.infrastructure.client;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.List;

@Component
public class MlServiceClient {

    private static final Logger log = LoggerFactory.getLogger(MlServiceClient.class);

    private final WebClient webClient;

    public MlServiceClient(@Value("${ml.service.url:http://localhost:8000}") String mlServiceUrl) {
        this.webClient = WebClient.builder()
                .baseUrl(mlServiceUrl)
                .build();
    }

    public MlPredictResponse predict(MlPredictRequest request) {
        try {
            return webClient.post()
                    .uri("/predict")
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(MlPredictResponse.class)
                    .block(Duration.ofSeconds(5));
        } catch (Exception e) {
            log.warn("ML Service indisponível: {}", e.getMessage());
            return null;
        }
    }

    public record MlPredictRequest(
            double consumo_kwh,
            boolean uso_horario_pico,
            int quantidade_equipamentos,
            String tipo_imovel,
            double horas_alto_consumo
    ) {}

    public record MlPredictResponse(
            String categoria,
            double probabilidade,
            List<String> recomendacoes,
            String origem
    ) {}
}
