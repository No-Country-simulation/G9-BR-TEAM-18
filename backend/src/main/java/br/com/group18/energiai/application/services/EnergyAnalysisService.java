package br.com.group18.energiai.application.services;

import br.com.group18.energiai.application.exception.InvalidRequestException;
import br.com.group18.energiai.core.domain.model.EnergyAnalysis;
import br.com.group18.energiai.core.domain.model.MlResult;
import br.com.group18.energiai.core.domain.model.Property;
import br.com.group18.energiai.core.domain.model.PropertyAppliance;
import br.com.group18.energiai.core.ports.in.GenerateAnalysisUseCase;
import br.com.group18.energiai.core.ports.out.AnalysisRepositoryPort;
import br.com.group18.energiai.infrastructure.client.AnalysisMapper;
import br.com.group18.energiai.infrastructure.client.MlEnvelope;
import br.com.group18.energiai.infrastructure.client.MlServiceClient;
import br.com.group18.energiai.infrastructure.client.MlServiceUnavailableException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class EnergyAnalysisService implements GenerateAnalysisUseCase {

    private static final BigDecimal KWH_TARIFF = new BigDecimal(System.getenv().getOrDefault("KWH_TARIFF", "0.75"));

    private final AnalysisRepositoryPort repository;
    private final MlServiceClient mlServiceClient;
    private final ApplianceAggregationService aggregationService;
    private final AnalysisMapper analysisMapper;

    public EnergyAnalysisService(
            AnalysisRepositoryPort repository,
            MlServiceClient mlServiceClient,
            ApplianceAggregationService aggregationService,
            AnalysisMapper analysisMapper) {
        this.repository = repository;
        this.mlServiceClient = mlServiceClient;
        this.aggregationService = aggregationService;
        this.analysisMapper = analysisMapper;
    }

    @Override
    public EnergyAnalysis execute(
            Property property,
            List<PropertyAppliance> appliances,
            BigDecimal consumptionKwh,
            Boolean peakHourUsage,
            BigDecimal highConsumptionHours,
            String highestConsumptionCategory) {
        if (!property.isActive()) {
            throw new InvalidRequestException("A propriedade está inativa e não pode receber análises.");
        }

        EnergyAnalysis analysis = repository.save(new EnergyAnalysis(
                property.getId(), scale(consumptionKwh), peakHourUsage, scale(highConsumptionHours)));
        ApplianceAggregationService.AggregationResult aggregation = aggregationService.aggregate(appliances);

        try {
            MlEnvelope request = buildMlRequest(analysis, property, aggregation, highestConsumptionCategory);
            MlEnvelope response = mlServiceClient.predict(request);

            if (response == null) {
                throw new MlServiceUnavailableException(
                        "Serviço de análise temporariamente indisponível. Tente novamente em instantes.");
            }

            MlResult mlResult = analysisMapper.toMlResult(response);

            analysis.setCategory(mlResult.category());
            analysis.setProbability(BigDecimal.valueOf(mlResult.probability()).setScale(2, RoundingMode.HALF_UP));
            analysis.setRecommendations(mlResult.recommendations());
            analysis.setSource(mlResult.source());
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

    private MlEnvelope buildMlRequest(
            EnergyAnalysis analysis, Property property, ApplianceAggregationService.AggregationResult aggregation,
            String highestConsumptionCategory) {
        Map<String, Object> dist = Map.of(
                "REFRIGERATION_WATTS", aggregation.refrigerationWatts(),
                "HEATING_WATTS", aggregation.heatingWatts(),
                "AIR_CONDITIONING_WATTS", aggregation.airConditioningWatts(),
                "LIGHTING_WATTS", aggregation.lightingWatts());

        java.util.HashMap<String, Object> body = new java.util.HashMap<>();
        body.put("consumption_kwh", analysis.getConsumptionKwh().doubleValue());
        body.put("peak_hour_usage", analysis.getPeakHourUsage());
        body.put("equipment_quantity", aggregation.totalEquipment());
        body.put("property_type", property.getPropertyType());
        body.put("high_consumption_hours", analysis.getHighConsumptionHours().doubleValue());
        body.put("daily_consumption_distribution", dist);

        if (highestConsumptionCategory != null && !highestConsumptionCategory.isBlank()) {
            body.put("highest_consumption_category", highestConsumptionCategory);
        }

        return new MlEnvelope(body);
    }

    private BigDecimal scale(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }
}
