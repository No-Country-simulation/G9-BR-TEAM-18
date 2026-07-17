package br.com.group18.energiai.infrastructure.adapters.out.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "energy_analysis")
public class EnergyAnalysisEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Double consumptionKwh;

    @Column(nullable = false)
    private Boolean peakHourUsage;

    @Column(nullable = false)
    private Integer equipmentQuantity;

    @Column(nullable = false, length = 50)
    private String propertyType;

    @Column(nullable = false)
    private Double highConsumptionHours;

    @Column(length = 50)
    private String highestConsumptionCategory;

    private Double refrigerationWatts;
    private Double heatingWatts;
    private Double airConditioningWatts;
    private Double lightingWatts;

    @Column(nullable = false, length = 20)
    private String category;

    @Column(nullable = false)
    private Double probability;

    @Column(nullable = false)
    private Double estimatedMonthlyCost;

    @Column(columnDefinition = "TEXT")
    @Convert(converter = StringListConverter.class)
    private List<String> recommendations;

    @Column(length = 100)
    private String source;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    public EnergyAnalysisEntity() {}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

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

    public Double getEstimatedMonthlyCost() {
        return estimatedMonthlyCost;
    }

    public void setEstimatedMonthlyCost(Double estimatedMonthlyCost) {
        this.estimatedMonthlyCost = estimatedMonthlyCost;
    }

    public List<String> getRecommendations() {
        return recommendations;
    }

    public void setRecommendations(List<String> recommendations) {
        this.recommendations = recommendations;
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
}
