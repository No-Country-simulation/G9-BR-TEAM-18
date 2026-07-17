package br.com.group18.energiai.application.services;

import br.com.group18.energiai.core.domain.model.ApplianceItem;
import br.com.group18.energiai.core.domain.model.ApplianceType;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

/**
 * Service that aggregates a list of appliances selected by the user into the features expected by
 * the ML Service.
 */
@Service
public class ApplianceAggregationService {

  /** Aggregates the appliances and returns a map with all calculated features */
  public AggregationResult aggregate(List<ApplianceItem> appliances) {
    if (appliances == null || appliances.isEmpty()) {
      return new AggregationResult(
          Collections.emptyMap(),
          "Outros",
          Map.of(
              "REFRIGERATION_WATTS",
              0.0,
              "HEATING_WATTS",
              0.0,
              "AIR_CONDITIONING_WATTS",
              0.0,
              "LIGHTING_WATTS",
              0.0),
          0,
          0.0);
    }

    // 1. Total equipment count
    int totalEquipment = appliances.stream().mapToInt(ApplianceItem::getQuantity).sum();

    // 2. Estimated monthly consumption (kWh)
    double monthlyConsumptionKwh =
        appliances.stream().mapToDouble(ApplianceItem::getMonthlyConsumptionKwh).sum();

    // 3. Group total power by ML category (7 categories)
    Map<String, Double> powerByMlCategory = new HashMap<>();
    for (String cat : ApplianceType.getMlCategories()) {
      powerByMlCategory.put(cat, 0.0);
    }
    for (ApplianceItem item : appliances) {
      String cat = item.getType().getMlCategory();
      double total = powerByMlCategory.getOrDefault(cat, 0.0) + item.getTotalPowerWatts();
      powerByMlCategory.put(cat, total);
    }

    // 4. Highest consumption category (ML)
    String highestConsumptionCategory =
        Collections.max(powerByMlCategory.entrySet(), Map.Entry.comparingByValue()).getKey();

    // 5. Group total power by distribution field (4 fields)
    Map<String, Double> powerByDistribution = new HashMap<>();
    powerByDistribution.put("REFRIGERATION_WATTS", 0.0);
    powerByDistribution.put("HEATING_WATTS", 0.0);
    powerByDistribution.put("AIR_CONDITIONING_WATTS", 0.0);
    powerByDistribution.put("LIGHTING_WATTS", 0.0);

    for (ApplianceItem item : appliances) {
      String field = item.getType().getDistributionField();
      if (!"NONE".equals(field) && powerByDistribution.containsKey(field)) {
        double total = powerByDistribution.get(field) + item.getTotalPowerWatts();
        powerByDistribution.put(field, total);
      }
    }

    // 6. Complete feature map
    Map<String, Double> features = new HashMap<>();
    features.put("equipment_quantity", (double) totalEquipment);
    features.put("consumption_kwh_estimated", Math.round(monthlyConsumptionKwh * 100.0) / 100.0);
    for (Map.Entry<String, Double> entry : powerByMlCategory.entrySet()) {
      features.put("cat_potencia_" + entry.getKey().toLowerCase(), entry.getValue());
    }
    for (Map.Entry<String, Double> entry : powerByDistribution.entrySet()) {
      features.put(entry.getKey(), entry.getValue());
    }

    return new AggregationResult(
        features,
        highestConsumptionCategory,
        powerByDistribution,
        totalEquipment,
        Math.round(monthlyConsumptionKwh * 100.0) / 100.0);
  }

  /** Aggregation result */
  public record AggregationResult(
      Map<String, Double> allFeatures,
      String highestConsumptionCategory,
      Map<String, Double> consumptionDistribution,
      int totalEquipment,
      double calculatedConsumptionKwh) {
    public AggregationResult {
      allFeatures = Map.copyOf(allFeatures);
      consumptionDistribution = Map.copyOf(consumptionDistribution);
    }
  }
}
