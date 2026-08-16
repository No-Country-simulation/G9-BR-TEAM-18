package br.com.group18.energiai.core.ports.out;

import java.util.List;

public record PredictionInput(
        double consumptionKwh,
        boolean peakHourUsage,
        int equipmentQuantity,
        String propertyType,
        double highConsumptionHours,
        PowerDistribution powerDistribution,
        String highestConsumptionCategory,
        List<String> highestConsumptionProducts) {

    public record PowerDistribution(
            double refrigerationWatts, double heatingWatts, double airConditioningWatts, double lightingWatts) {}
}
