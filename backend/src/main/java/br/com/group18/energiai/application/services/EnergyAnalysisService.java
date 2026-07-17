package br.com.group18.energiai.application.services;

import br.com.group18.energiai.core.domain.model.EnergyAnalysis;
import br.com.group18.energiai.core.ports.in.GenerateAnalysisUseCase;
import br.com.group18.energiai.core.ports.out.AnalysisRepositoryPort;
import br.com.group18.energiai.infrastructure.client.MlServiceClient;
import br.com.group18.energiai.infrastructure.client.MlServiceUnavailableException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Service that coordinates energy analysis by delegating to the ML Service.
 *
 * The ML Service is the single source of truth for classification logic,
 * including its own rule-based fallback when the model is unavailable.
 * No rule-based logic is duplicated here.
 */
public class EnergyAnalysisService implements GenerateAnalysisUseCase {

    private static final Logger log = LoggerFactory.getLogger(EnergyAnalysisService.class);

    private static final double KWH_TARIFF = Double.parseDouble(System.getenv().getOrDefault("KWH_TARIFF", "0.75"));

    private final AnalysisRepositoryPort repository;
    private final MlServiceClient mlServiceClient;

    public EnergyAnalysisService(AnalysisRepositoryPort repository, MlServiceClient mlServiceClient) {
        this.repository = repository;
        this.mlServiceClient = mlServiceClient;
    }

    @Override
    public EnergyAnalysis execute(
            Double consumptionKwh,
            Boolean peakHourUsage,
            Integer equipmentQuantity,
            String propertyType,
            Double highConsumptionHours,
            String highestConsumptionCategory,
            Double refrigerationWatts,
            Double heatingWatts,
            Double airConditioningWatts,
            Double lightingWatts) {
        EnergyAnalysis analysis = new EnergyAnalysis(
                consumptionKwh, peakHourUsage, equipmentQuantity, propertyType, highConsumptionHours);
        analysis.setHighestConsumptionCategory(highestConsumptionCategory);
        analysis.setRefrigerationWatts(refrigerationWatts);
        analysis.setHeatingWatts(heatingWatts);
        analysis.setAirConditioningWatts(airConditioningWatts);
        analysis.setLightingWatts(lightingWatts);

        var mlRequest = new MlServiceClient.MlPredictRequest(
                consumptionKwh,
                peakHourUsage,
                equipmentQuantity,
                propertyType,
                highConsumptionHours,
                highestConsumptionCategory,
                new MlServiceClient.DailyConsumptionDistribution(
                        refrigerationWatts != null ? refrigerationWatts : 0.0,
                        heatingWatts != null ? heatingWatts : 0.0,
                        airConditioningWatts != null ? airConditioningWatts : 0.0,
                        lightingWatts != null ? lightingWatts : 0.0));

        var mlResponse = mlServiceClient.predict(mlRequest);

        if (mlResponse == null) {
            throw new MlServiceUnavailableException(
                    "Serviço de análise temporariamente indisponível. Tente novamente em instantes.");
        }

        log.info(
                "Resposta do ML Service: {} (confiança: {}, origem: {})",
                mlResponse.category(),
                mlResponse.probability(),
                mlResponse.source());

        if (mlResponse.source().contains("groq")) {
            log.info("Confiança abaixo de 80% — Groq acionado");
        }

        analysis.setCategory(mlResponse.category());
        analysis.setProbability(mlResponse.probability());
        analysis.setRecommendations(mlResponse.recommendations());
        analysis.setSource(mlResponse.source());
        analysis.setEstimatedMonthlyCost(consumptionKwh * KWH_TARIFF);

        return repository.save(analysis);
    }
}
