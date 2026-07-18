package br.com.group18.energiai.core.ports.in;

import br.com.group18.energiai.core.domain.model.EnergyAnalysis;

public interface GenerateAnalysisUseCase {
    EnergyAnalysis execute(
            Long userId,
            Double consumptionKwh,
            Boolean peakHourUsage,
            Integer equipmentQuantity,
            String propertyType,
            Double highConsumptionHours,
            String highestConsumptionCategory,
            Double refrigerationWatts,
            Double heatingWatts,
            Double airConditioningWatts,
            Double lightingWatts);

    default EnergyAnalysis execute(
            Long userId,
            Double consumptionKwh,
            Boolean peakHourUsage,
            Integer equipmentQuantity,
            String propertyType,
            Double highConsumptionHours) {
        return execute(
                userId,
                consumptionKwh,
                peakHourUsage,
                equipmentQuantity,
                propertyType,
                highConsumptionHours,
                "Outros",
                0.0,
                0.0,
                0.0,
                0.0);
    }
}
