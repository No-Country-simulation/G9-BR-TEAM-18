package br.com.group18.energiai.infrastructure.adapters.in.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.util.List;

public class AnalysisRequestDTO {

  public static class ApplianceItemDTO {
    private String type;
    private int quantity;

    public String getType() {
      return type;
    }

    public void setType(String type) {
      this.type = type;
    }

    public int getQuantity() {
      return quantity;
    }

    public void setQuantity(int quantity) {
      this.quantity = quantity;
    }
  }

  @Positive private Double consumptionKwh;

  @NotNull private Boolean peakHourUsage;

  @Positive private Integer equipmentQuantity;

  @NotBlank private String propertyType;

  @NotNull @Positive private Double highConsumptionHours;

  private String highestConsumptionCategory = "Outros";
  private Double refrigerationWatts = 0.0;
  private Double heatingWatts = 0.0;
  private Double airConditioningWatts = 0.0;
  private Double lightingWatts = 0.0;

  private List<ApplianceItemDTO> appliances;

  public static class ConsumptionDistribution {
    @com.fasterxml.jackson.annotation.JsonProperty("REFRIGERATION_WATTS")
    private Double refrigerationWatts = 0.0;

    @com.fasterxml.jackson.annotation.JsonProperty("HEATING_WATTS")
    private Double heatingWatts = 0.0;

    @com.fasterxml.jackson.annotation.JsonProperty("AIR_CONDITIONING_WATTS")
    private Double airConditioningWatts = 0.0;

    @com.fasterxml.jackson.annotation.JsonProperty("LIGHTING_WATTS")
    private Double lightingWatts = 0.0;

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
  }

  private ConsumptionDistribution dailyConsumptionDistribution;

  public Double getConsumptionKwh() {
    return consumptionKwh;
  }

  public void setConsumptionKwh(Double consumptionKwh) {
    this.consumptionKwh = consumptionKwh;
  }

  public Boolean getPeakHourUsage() {
    return peakHourUsage;
  }

  public void setPeakHourUsage(Boolean peakHourUsage) {
    this.peakHourUsage = peakHourUsage;
  }

  public Integer getEquipmentQuantity() {
    return equipmentQuantity;
  }

  public void setEquipmentQuantity(Integer equipmentQuantity) {
    this.equipmentQuantity = equipmentQuantity;
  }

  public String getPropertyType() {
    return propertyType;
  }

  public void setPropertyType(String propertyType) {
    this.propertyType = propertyType;
  }

  public Double getHighConsumptionHours() {
    return highConsumptionHours;
  }

  public void setHighConsumptionHours(Double highConsumptionHours) {
    this.highConsumptionHours = highConsumptionHours;
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

  public ConsumptionDistribution getDailyConsumptionDistribution() {
    return dailyConsumptionDistribution;
  }

  public void setDailyConsumptionDistribution(
      ConsumptionDistribution dailyConsumptionDistribution) {
    this.dailyConsumptionDistribution = dailyConsumptionDistribution;
  }

  public List<ApplianceItemDTO> getAppliances() {
    return appliances;
  }

  public void setAppliances(List<ApplianceItemDTO> appliances) {
    this.appliances = appliances;
  }
}
