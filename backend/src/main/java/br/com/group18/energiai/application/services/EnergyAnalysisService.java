package br.com.group18.energiai.application.services;

import br.com.group18.energiai.application.exception.InvalidRequestException;
import br.com.group18.energiai.core.domain.model.ApplianceSnapshot;
import br.com.group18.energiai.core.domain.model.EnergyAnalysis;
import br.com.group18.energiai.core.domain.model.MlResult;
import br.com.group18.energiai.core.domain.model.Property;
import br.com.group18.energiai.core.domain.model.PropertyAppliance;
import br.com.group18.energiai.core.ports.in.GenerateAnalysisUseCase;
import br.com.group18.energiai.core.ports.out.AnalysisRepositoryPort;
import br.com.group18.energiai.infrastructure.adapters.in.web.dto.AnalysisResponseDTO;
import br.com.group18.energiai.infrastructure.client.AnalysisMapper;
import br.com.group18.energiai.infrastructure.client.MlEnvelope;
import br.com.group18.energiai.infrastructure.client.MlServiceClient;
import br.com.group18.energiai.infrastructure.client.MlServiceUnavailableException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Locale;
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

        EnergyAnalysis analysis =
                new EnergyAnalysis(property.getId(), scale(consumptionKwh), peakHourUsage, scale(highConsumptionHours));
        analysis.setPropertyType(property.getPropertyType());
        analysis.setAppliancesSnapshot(toSnapshots(appliances));

        analysis = repository.save(analysis);
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

    public AnalysisResponseDTO simulate(
            Property property,
            List<PropertyAppliance> appliances,
            BigDecimal consumptionKwh,
            Boolean peakHourUsage,
            BigDecimal highConsumptionHours,
            String highestConsumptionCategory) {
        ApplianceAggregationService.AggregationResult aggregation = aggregationService.aggregate(appliances);

        MlEnvelope request = buildMlRequest(
                consumptionKwh.doubleValue(),
                Boolean.TRUE.equals(peakHourUsage),
                aggregation.totalEquipment(),
                property.getPropertyType(),
                highConsumptionHours.doubleValue(),
                aggregation,
                highestConsumptionCategory);
        MlEnvelope response = mlServiceClient.predictSimulate(request);

        if (response == null) {
            throw new MlServiceUnavailableException(
                    "Serviço de análise temporariamente indisponível. Tente novamente em instantes.");
        }

        MlResult mlResult = analysisMapper.toMlResult(response);
        BigDecimal estimatedCost = consumptionKwh.multiply(KWH_TARIFF).setScale(2, RoundingMode.HALF_UP);

        List<AnalysisResponseDTO.ApplianceSnapshotDTO> snapshots = toSnapshots(appliances).stream()
                .map(snap -> new AnalysisResponseDTO.ApplianceSnapshotDTO(
                        snap.getApplianceName(),
                        snap.getApplianceCategory(),
                        snap.getQuantity(),
                        snap.getAveragePowerWatts(),
                        snap.getAverageDailyUseHours(),
                        snap.getMonthlyConsumptionKwh()))
                .toList();

        return new AnalysisResponseDTO(
                null,
                property.getId(),
                scale(consumptionKwh),
                peakHourUsage,
                scale(highConsumptionHours),
                estimatedCost,
                mlResult.category(),
                BigDecimal.valueOf(mlResult.probability()).setScale(2, RoundingMode.HALF_UP),
                "SIMULADO",
                mlResult.source(),
                mlResult.recommendations(),
                null,
                null,
                snapshots);
    }

    private List<ApplianceSnapshot> toSnapshots(List<PropertyAppliance> appliances) {
        return appliances.stream()
                .map(pa -> new ApplianceSnapshot(
                        pa.getAppliance().getName(),
                        pa.getAppliance().getApplianceCategory(),
                        pa.getQuantity(),
                        pa.getAppliance().getAveragePowerWatts(),
                        pa.getAppliance().getAverageDailyUseHours(),
                        pa.getMonthlyConsumptionKwh()))
                .toList();
    }

    private MlEnvelope buildMlRequest(
            EnergyAnalysis analysis,
            Property property,
            ApplianceAggregationService.AggregationResult aggregation,
            String highestConsumptionCategory) {
        return buildMlRequest(
                analysis.getConsumptionKwh().doubleValue(),
                analysis.getPeakHourUsage(),
                aggregation.totalEquipment(),
                property.getPropertyType(),
                analysis.getHighConsumptionHours().doubleValue(),
                aggregation,
                highestConsumptionCategory);
    }

    private MlEnvelope buildMlRequest(
            double consumptionKwh,
            boolean peakHourUsage,
            int equipmentQuantity,
            String propertyType,
            double highConsumptionHours,
            ApplianceAggregationService.AggregationResult aggregation,
            String highestConsumptionCategory) {
        Map<String, Object> dist = Map.of(
                "REFRIGERATION_WATTS", aggregation.refrigerationWatts(),
                "HEATING_WATTS", aggregation.heatingWatts(),
                "AIR_CONDITIONING_WATTS", aggregation.airConditioningWatts(),
                "LIGHTING_WATTS", aggregation.lightingWatts());

        String mlPropertyType =
                switch (propertyType.toUpperCase(Locale.ROOT)) {
                    case "RESIDENCIAL" -> "Casa";
                    case "APARTAMENTO" -> "Apartamento";
                    case "COMERCIAL" -> "Comercial";
                    default -> propertyType;
                };

        List<String> topProducts = aggregation.highestConsumptionProducts();

        java.util.HashMap<String, Object> body = new java.util.HashMap<>();
        body.put("consumption_kwh", consumptionKwh);
        body.put("peak_hour_usage", peakHourUsage);
        body.put("equipment_quantity", equipmentQuantity);
        body.put("property_type", mlPropertyType);
        body.put("high_consumption_hours", highConsumptionHours);
        body.put("daily_consumption_distribution", dist);

        if (highestConsumptionCategory != null && !highestConsumptionCategory.isBlank()) {
            body.put("highest_consumption_category", highestConsumptionCategory);
        }

        if (topProducts != null && !topProducts.isEmpty()) {
            body.put("highest_consumption_products", topProducts);
        }

        return new MlEnvelope(body);
    }

    private BigDecimal scale(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }
}
