package br.com.group18.energiai.application.services;

import br.com.group18.energiai.core.domain.model.PropertyAppliance;
import java.math.BigDecimal;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Service;

/** Builds the inventory-derived features expected by the ML service. */
@Service
public class ApplianceAggregationService {

    public AggregationResult aggregate(List<PropertyAppliance> appliances) {
        List<PropertyAppliance> inventory = appliances == null ? List.of() : appliances;
        BigDecimal refrigerationWatts = BigDecimal.ZERO;
        BigDecimal heatingWatts = BigDecimal.ZERO;
        BigDecimal airConditioningWatts = BigDecimal.ZERO;
        BigDecimal lightingWatts = BigDecimal.ZERO;
        int totalEquipment = 0;

        for (PropertyAppliance propertyAppliance : inventory) {
            int quantity = propertyAppliance.getQuantity() == null ? 0 : propertyAppliance.getQuantity();
            totalEquipment += quantity;
            BigDecimal watts = propertyAppliance.getTotalPowerWatts();
            switch (distributionFor(propertyAppliance)) {
                case REFRIGERATION -> refrigerationWatts = refrigerationWatts.add(watts);
                case HEATING -> heatingWatts = heatingWatts.add(watts);
                case AIR_CONDITIONING -> airConditioningWatts = airConditioningWatts.add(watts);
                case LIGHTING -> lightingWatts = lightingWatts.add(watts);
                case OTHER -> {
                    // Categories outside the ML distribution are still counted as equipment.
                }
            }
        }

        return new AggregationResult(
                totalEquipment,
                refrigerationWatts.doubleValue(),
                heatingWatts.doubleValue(),
                airConditioningWatts.doubleValue(),
                lightingWatts.doubleValue());
    }

    private Distribution distributionFor(PropertyAppliance propertyAppliance) {
        if (propertyAppliance.getAppliance() == null
                || propertyAppliance.getAppliance().getApplianceCategory() == null) {
            return Distribution.OTHER;
        }
        String category =
                propertyAppliance.getAppliance().getApplianceCategory().strip().toUpperCase(Locale.ROOT);
        return switch (category) {
            case "REFRIGERACAO", "REFRIGERAÇÃO", "REFRIGERATION" -> Distribution.REFRIGERATION;
            case "AQUECIMENTO", "HEATING" -> Distribution.HEATING;
            case "CLIMATIZACAO", "CLIMATIZAÇÃO", "AR_CONDICIONADO", "AIR_CONDITIONING" -> Distribution.AIR_CONDITIONING;
            case "ILUMINACAO", "ILUMINAÇÃO", "LIGHTING" -> Distribution.LIGHTING;
            default -> Distribution.OTHER;
        };
    }

    private enum Distribution {
        REFRIGERATION,
        HEATING,
        AIR_CONDITIONING,
        LIGHTING,
        OTHER
    }

    public record AggregationResult(
            int totalEquipment,
            double refrigerationWatts,
            double heatingWatts,
            double airConditioningWatts,
            double lightingWatts) {}
}
