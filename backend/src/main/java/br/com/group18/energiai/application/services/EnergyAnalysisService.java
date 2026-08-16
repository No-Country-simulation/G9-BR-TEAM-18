package br.com.group18.energiai.application.services;

import br.com.group18.energiai.application.dto.EnergySimulationResult;
import br.com.group18.energiai.application.exception.InvalidRequestException;
import br.com.group18.energiai.application.exception.MlServiceUnavailableException;
import br.com.group18.energiai.core.domain.model.ApplianceSnapshot;
import br.com.group18.energiai.core.domain.model.EnergyAnalysis;
import br.com.group18.energiai.core.domain.model.MlResult;
import br.com.group18.energiai.core.domain.model.Property;
import br.com.group18.energiai.core.domain.model.PropertyAppliance;
import br.com.group18.energiai.core.ports.in.GenerateAnalysisUseCase;
import br.com.group18.energiai.core.ports.out.AnalysisRepositoryPort;
import br.com.group18.energiai.core.ports.out.EnergyPredictionPort;
import br.com.group18.energiai.core.ports.out.PredictionInput;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

public class EnergyAnalysisService implements GenerateAnalysisUseCase {

    private static final String COMPLETED_STATUS = "CONCLUIDA";
    private static final String FAILED_STATUS = "FALHA";
    private static final String SERVICE_UNAVAILABLE_MESSAGE =
            "Serviço de análise temporariamente indisponível. Tente novamente em instantes.";

    private final AnalysisRepositoryPort analysisRepository;
    private final EnergyPredictionPort predictionPort;
    private final ApplianceAggregationService aggregationService;
    private final BigDecimal kwhTariff;

    public EnergyAnalysisService(
            AnalysisRepositoryPort analysisRepository,
            EnergyPredictionPort predictionPort,
            ApplianceAggregationService aggregationService,
            BigDecimal kwhTariff) {
        this.analysisRepository = analysisRepository;
        this.predictionPort = predictionPort;
        this.aggregationService = aggregationService;
        this.kwhTariff = kwhTariff;
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

        EnergyAnalysis analysis =
                new EnergyAnalysis(property.getId(), scale(consumptionKwh), peakHourUsage, scale(highConsumptionHours));
        analysis.setPropertyType(property.getPropertyType());
        analysis.setAppliancesSnapshot(toSnapshots(appliances));

        analysis = analysisRepository.save(analysis);
        ApplianceAggregationService.AggregationResult aggregation = aggregationService.aggregate(appliances);

        try {
            MlResult mlResult = predictionPort.predict(
                    toPredictionInput(analysis, property, aggregation, highestConsumptionCategory));
            requireSuccessfulPrediction(mlResult);

            analysis.setCategory(mlResult.category());
            analysis.setProbability(BigDecimal.valueOf(mlResult.probability()).setScale(2, RoundingMode.HALF_UP));
            analysis.setRecommendations(mlResult.recommendations());
            analysis.setSource(mlResult.source());
            analysis.setEstimatedMonthlyCost(
                    analysis.getConsumptionKwh().multiply(kwhTariff).setScale(2, RoundingMode.HALF_UP));
            analysis.setStatus(COMPLETED_STATUS);
            return analysisRepository.save(analysis);
        } catch (RuntimeException exception) {
            analysis.setStatus(FAILED_STATUS);
            analysisRepository.save(analysis);
            throw exception;
        }
    }

    public EnergySimulationResult simulate(
            Property property,
            List<PropertyAppliance> appliances,
            BigDecimal consumptionKwh,
            Boolean peakHourUsage,
            BigDecimal highConsumptionHours,
            String highestConsumptionCategory) {
        ApplianceAggregationService.AggregationResult aggregation = aggregationService.aggregate(appliances);

        MlResult mlResult = predictionPort.predictSimulated(toPredictionInput(
                consumptionKwh.doubleValue(),
                Boolean.TRUE.equals(peakHourUsage),
                aggregation.totalEquipment(),
                property.getPropertyType(),
                highConsumptionHours.doubleValue(),
                aggregation,
                highestConsumptionCategory));
        requireSuccessfulPrediction(mlResult);

        return new EnergySimulationResult(
                property.getId(),
                scale(consumptionKwh),
                peakHourUsage,
                scale(highConsumptionHours),
                consumptionKwh.multiply(kwhTariff).setScale(2, RoundingMode.HALF_UP),
                mlResult.category(),
                BigDecimal.valueOf(mlResult.probability()).setScale(2, RoundingMode.HALF_UP),
                mlResult.source(),
                mlResult.recommendations(),
                aggregation.highestConsumptionProducts(),
                toSnapshots(appliances));
    }

    private void requireSuccessfulPrediction(MlResult mlResult) {
        if (mlResult == null) {
            throw new MlServiceUnavailableException(SERVICE_UNAVAILABLE_MESSAGE);
        }
    }

    private List<ApplianceSnapshot> toSnapshots(List<PropertyAppliance> appliances) {
        return appliances.stream()
                .map(propertyAppliance -> new ApplianceSnapshot(
                        propertyAppliance.getAppliance().getName(),
                        propertyAppliance.getAppliance().getApplianceCategory(),
                        propertyAppliance.getQuantity(),
                        propertyAppliance.getAppliance().getAveragePowerWatts(),
                        propertyAppliance.getAppliance().getAverageDailyUseHours(),
                        propertyAppliance.getMonthlyConsumptionKwh()))
                .toList();
    }

    private PredictionInput toPredictionInput(
            EnergyAnalysis analysis,
            Property property,
            ApplianceAggregationService.AggregationResult aggregation,
            String highestConsumptionCategory) {
        return toPredictionInput(
                analysis.getConsumptionKwh().doubleValue(),
                Boolean.TRUE.equals(analysis.getPeakHourUsage()),
                aggregation.totalEquipment(),
                property.getPropertyType(),
                analysis.getHighConsumptionHours().doubleValue(),
                aggregation,
                highestConsumptionCategory);
    }

    private PredictionInput toPredictionInput(
            double consumptionKwh,
            boolean peakHourUsage,
            int equipmentQuantity,
            String propertyType,
            double highConsumptionHours,
            ApplianceAggregationService.AggregationResult aggregation,
            String highestConsumptionCategory) {
        return new PredictionInput(
                consumptionKwh,
                peakHourUsage,
                equipmentQuantity,
                propertyType,
                highConsumptionHours,
                new PredictionInput.PowerDistribution(
                        aggregation.refrigerationWatts(),
                        aggregation.heatingWatts(),
                        aggregation.airConditioningWatts(),
                        aggregation.lightingWatts()),
                highestConsumptionCategory,
                aggregation.highestConsumptionProducts());
    }

    private BigDecimal scale(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }
}
