package br.com.group18.energiai.infrastructure.adapters.in.web.dto;

import java.time.LocalDateTime;
import java.util.List;

public class AnalysisResponseDTO {

  private Long id;
  private String category;
  private Double probability;
  private List<String> recommendations;
  private Double estimatedMonthlyCost;
  private String source;
  private LocalDateTime createdAt;
  private String highestConsumptionCategory;
  private Double refrigerationWatts;
  private Double heatingWatts;
  private Double airConditioningWatts;
  private Double lightingWatts;
  private Double consumptionKwh;
  private Integer totalEquipment;

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public String getCategory() {
    return category;
  }

  public void setCategory(String category) {
    this.category = category;
  }

  public Double getProbability() {
    return probability;
  }

  public void setProbability(Double probability) {
    this.probability = probability;
  }

  public List<String> getRecommendations() {
    return recommendations;
  }

  public void setRecommendations(List<String> recommendations) {
    this.recommendations = recommendations;
  }

  public Double getEstimatedMonthlyCost() {
    return estimatedMonthlyCost;
  }

  public void setEstimatedMonthlyCost(Double estimatedMonthlyCost) {
    this.estimatedMonthlyCost = estimatedMonthlyCost;
  }

  public String getSource() {
    return source;
  }

  public void setSource(String source) {
    this.source = source;
  }

  public LocalDateTime getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(LocalDateTime createdAt) {
    this.createdAt = createdAt;
  }

  public String getHighestConsumptionCategory() {
    return highestConsumptionCategory;
  }

  public void setHighestConsumptionCategory(String highestConsumptionCategory) {
    this.highestConsumptionCategory = highestConsumptionCategory;
  }

  public Double getRefrigerationWatts() {
    return refrigerationWatts;
  }

  public void setRefrigerationWatts(Double refrigerationWatts) {
    this.refrigerationWatts = refrigerationWatts;
  }

  public Double getHeatingWatts() {
    return heatingWatts;
  }

  public void setHeatingWatts(Double heatingWatts) {
    this.heatingWatts = heatingWatts;
  }

  public Double getAirConditioningWatts() {
    return airConditioningWatts;
  }

  public void setAirConditioningWatts(Double airConditioningWatts) {
    this.airConditioningWatts = airConditioningWatts;
  }

  public Double getLightingWatts() {
    return lightingWatts;
  }

  public void setLightingWatts(Double lightingWatts) {
    this.lightingWatts = lightingWatts;
  }

  public Double getConsumptionKwh() {
    return consumptionKwh;
  }

  public void setConsumptionKwh(Double consumptionKwh) {
    this.consumptionKwh = consumptionKwh;
  }

  public Integer getTotalEquipment() {
    return totalEquipment;
  }

  public void setTotalEquipment(Integer totalEquipment) {
    this.totalEquipment = totalEquipment;
  }
}
