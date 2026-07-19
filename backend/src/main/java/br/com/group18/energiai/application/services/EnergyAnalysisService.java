package br.com.group18.energiai.application.services;

import br.com.group18.energiai.application.exception.InvalidRequestException;
import br.com.group18.energiai.core.domain.model.EnergyAnalysis;
import br.com.group18.energiai.core.domain.model.Property;
import br.com.group18.energiai.core.domain.model.PropertyAppliance;
import br.com.group18.energiai.core.ports.in.GenerateAnalysisUseCase;
import br.com.group18.energiai.core.ports.out.AnalysisRepositoryPort;
import br.com.group18.energiai.infrastructure.client.MlServiceClient;
import br.com.group18.energiai.infrastructure.client.MlServiceUnavailableException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Service;

@Service
public class EnergyAnalysisService implements GenerateAnalysisUseCase {

    private static final BigDecimal KWH_TARIFF = new BigDecimal(System.getenv().getOrDefault("KWH_TARIFF", "0.75"));

    private final AnalysisRepositoryPort repository;
    private final MlServiceClient mlServiceClient;
    private final ApplianceAggregationService aggregationService;

    public EnergyAnalysisService(
            AnalysisRepositoryPort repository,
            MlServiceClient mlServiceClient,
            ApplianceAggregationService aggregationService) {
        this.repository = repository;
        this.mlServiceClient = mlServiceClient;
        this.aggregationService = aggregationService;
    }

    @Override
    public EnergyAnalysis execute(
            Property property,
            List<PropertyAppliance> appliances,
            BigDecimal consumptionKwh,
            Boolean peakHourUsage,
            BigDecimal highConsumptionHours) {
        if (!property.isActive()) {
            throw new InvalidRequestException("A propriedade está inativa e não pode receber análises.");
        }

        EnergyAnalysis analysis = repository.save(new EnergyAnalysis(
                property.getId(), scale(consumptionKwh), peakHourUsage, scale(highConsumptionHours)));
        ApplianceAggregationService.AggregationResult aggregation = aggregationService.aggregate(appliances);

        try {
            MlServiceClient.MlPredictResponse mlResponse = mlServiceClient.predict(new MlServiceClient.MlPredictRequest(
                    analysis.getConsumptionKwh().doubleValue(),
                    analysis.getPeakHourUsage(),
                    aggregation.totalEquipment(),
                    property.getPropertyType(),
                    analysis.getHighConsumptionHours().doubleValue(),
                    new MlServiceClient.DailyConsumptionDistribution(
                            aggregation.refrigerationWatts(),
                            aggregation.heatingWatts(),
                            aggregation.airConditioningWatts(),
                            aggregation.lightingWatts())));

            if (mlResponse == null) {
                throw new MlServiceUnavailableException(
                        "Serviço de análise temporariamente indisponível. Tente novamente em instantes.");
            }

            analysis.setCategory(normalizeCategory(mlResponse.category()));
            analysis.setProbability(normalizeProbability(mlResponse.probability()));
            analysis.setRecommendations(mlResponse.recommendations());
            analysis.setEstimatedMonthlyCost(
                    analysis.getConsumptionKwh().multiply(KWH_TARIFF).setScale(2, RoundingMode.HALF_UP));
            analysis.setStatus("FINALIZADO");
            return repository.save(analysis);
        } catch (RuntimeException exception) {
            analysis.setStatus("FALHA");
            repository.save(analysis);
            throw exception;
        }
    }

    private String normalizeCategory(String category) {
        if (category == null || category.isBlank()) {
            throw new MlServiceUnavailableException("O serviço de análise retornou uma categoria vazia.");
        }

        String catNormalizada = category.strip().toUpperCase(Locale.ROOT);

        return switch (catNormalizada) {
            case "EXCELENTE", "BOM", "MEDIANO", "RUIM", "CRITICO" -> catNormalizada;
            default -> throw new MlServiceUnavailableException("Categoria inválida recebida do ML: " + category);
        };
    }

    private BigDecimal normalizeProbability(double probability) {
        if (Double.isNaN(probability) || Double.isInfinite(probability) || probability < 0 || probability > 1) {
            throw new MlServiceUnavailableException("O serviço de análise retornou uma probabilidade inválida.");
        }
        return BigDecimal.valueOf(probability).setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal scale(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }
}
