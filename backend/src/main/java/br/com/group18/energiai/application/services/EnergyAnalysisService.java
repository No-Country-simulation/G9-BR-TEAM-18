package br.com.group18.energiai.application.services;

import br.com.group18.energiai.core.domain.model.EnergyAnalysis;
import br.com.group18.energiai.core.ports.in.GenerateAnalysisUseCase;
import br.com.group18.energiai.core.ports.out.AnalysisRepositoryPort;
import br.com.group18.energiai.infrastructure.client.MlServiceClient;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class EnergyAnalysisService implements GenerateAnalysisUseCase {

  private static final Logger log = LoggerFactory.getLogger(EnergyAnalysisService.class);

  private static final double KWH_TARIFF =
      Double.parseDouble(System.getenv().getOrDefault("KWH_TARIFF", "0.75"));

  private static final Map<String, Double> BASE_CONSUMPTION_BY_TYPE =
      Map.of(
          "Casa", 250.0,
          "Apartamento", 150.0,
          "Comercial", 500.0,
          "Industria", 800.0,
          "Rural", 300.0,
          "Outro", 250.0);

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
    EnergyAnalysis analysis =
        new EnergyAnalysis(
            consumptionKwh, peakHourUsage, equipmentQuantity, propertyType, highConsumptionHours);
    analysis.setHighestConsumptionCategory(highestConsumptionCategory);
    analysis.setRefrigerationWatts(refrigerationWatts);
    analysis.setHeatingWatts(heatingWatts);
    analysis.setAirConditioningWatts(airConditioningWatts);
    analysis.setLightingWatts(lightingWatts);

    var mlRequest =
        new MlServiceClient.MlPredictRequest(
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

    if (mlResponse != null) {
      log.info(
          "Resposta do ML Service: {} (confiança: {}, origem: {})",
          mlResponse.category(),
          mlResponse.probability(),
          mlResponse.source());

      if (mlResponse.source().contains("groq")) {
        log.info("Confiança abaixo de 80% — Groq seria acionado se configurado");
      }

      analysis.setCategory(mlResponse.category());
      analysis.setProbability(mlResponse.probability());
      analysis.setRecommendations(mlResponse.recommendations());
      analysis.setSource(mlResponse.source());
      analysis.setEstimatedMonthlyCost(consumptionKwh * KWH_TARIFF);

      return repository.save(analysis);
    }

    log.info("ML Service indisponível — usando fallback rule-based");
    return executeRuleBased(analysis);
  }

  private EnergyAnalysis executeRuleBased(EnergyAnalysis analysis) {
    double index =
        calculateInefficiencyIndex(
            analysis.getConsumptionKwh(),
            analysis.getPeakHourUsage(),
            analysis.getEquipmentQuantity(),
            analysis.getPropertyType(),
            analysis.getHighConsumptionHours());

    String category;
    double probability;
    if (index < 0.2) {
      category = "EXCELENTE";
      probability = 0.92;
    } else if (index < 0.4) {
      category = "BOM";
      probability = 0.85;
    } else if (index < 0.6) {
      category = "MEDIANO";
      probability = 0.78;
    } else if (index < 0.8) {
      category = "RUIM";
      probability = 0.82;
    } else {
      category = "CRITICO";
      probability = 0.90;
    }

    analysis.setCategory(category);
    analysis.setProbability(probability);
    analysis.setSource("rule-based (backend)");
    analysis.setEstimatedMonthlyCost(analysis.getConsumptionKwh() * KWH_TARIFF);

    List<String> recommendations = new ArrayList<>();
    if (Boolean.TRUE.equals(analysis.getPeakHourUsage())) {
      recommendations.add(
          "Reduzir o uso de equipamentos potentes durante os horários de pico (18h às 21h).");
    }
    if ("RUIM".equals(category) || "CRITICO".equals(category)) {
      recommendations.add("Considere substituir equipamentos antigos por modelos mais eficientes.");
    }
    if (analysis.getEquipmentQuantity() > 10) {
      recommendations.add(
          "Avalie a real necessidade de todos os equipamentos ligados simultaneamente.");
    }
    if (analysis.getHighConsumptionHours() > 5) {
      recommendations.add(
          "Distribua o uso de equipamentos ao longo do dia para reduzir o horário de alto consumo.");
    }
    if ("EXCELENTE".equals(category)) {
      recommendations.add("Continue mantendo as boas práticas de eficiência energética!");
    } else if (recommendations.isEmpty()) {
      recommendations.add("Mantenha o bom acompanhamento dos seus hábitos de consumo!");
    }
    analysis.setRecommendations(recommendations);

    return repository.save(analysis);
  }

  private double calculateInefficiencyIndex(
      Double consumptionKwh,
      Boolean peakHourUsage,
      Integer equipmentQuantity,
      String propertyType,
      Double highConsumptionHours) {
    double base = BASE_CONSUMPTION_BY_TYPE.getOrDefault(propertyType, 250.0);
    double consumptionRatio = consumptionKwh / base;
    double consumptionNorm = Math.min(consumptionRatio / 3.0, 1.0);
    double equipNorm = Math.min(equipmentQuantity / 25.0, 1.0);
    double hoursNorm = Math.min(highConsumptionHours / 12.0, 1.0);
    double peakNorm = Boolean.TRUE.equals(peakHourUsage) ? 1.0 : 0.0;

    return 0.40 * consumptionNorm + 0.25 * peakNorm + 0.20 * equipNorm + 0.15 * hoursNorm;
  }
}
