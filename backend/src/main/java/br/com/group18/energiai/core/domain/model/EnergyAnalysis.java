package br.com.group18.energiai.core.domain.model;

import br.com.group18.energiai.core.domain.valueobject.EfficiencyCategory;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class EnergyAnalysis {

    private Long id;
    private Long propertyId;
    private BigDecimal consumptionKwh;
    private Boolean peakHourUsage;
    private BigDecimal highConsumptionHours;
    private BigDecimal estimatedMonthlyCost;
    private EfficiencyCategory category;
    private BigDecimal probability;
    private String status;
    private String source;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<String> recommendations = new ArrayList<>();

    public EnergyAnalysis() {}

    public EnergyAnalysis(
            Long propertyId, BigDecimal consumptionKwh, Boolean peakHourUsage, BigDecimal highConsumptionHours) {
        this.propertyId = propertyId;
        this.consumptionKwh = consumptionKwh;
        this.peakHourUsage = peakHourUsage;
        this.highConsumptionHours = highConsumptionHours;
        this.status = "PENDENTE";
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getPropertyId() {
        return propertyId;
    }

    public void setPropertyId(Long propertyId) {
        this.propertyId = propertyId;
    }

    public BigDecimal getConsumptionKwh() {
        return consumptionKwh;
    }

    public void setConsumptionKwh(BigDecimal consumptionKwh) {
        this.consumptionKwh = consumptionKwh;
    }

    public Boolean getPeakHourUsage() {
        return peakHourUsage;
    }

    public void setPeakHourUsage(Boolean peakHourUsage) {
        this.peakHourUsage = peakHourUsage;
    }

    public BigDecimal getHighConsumptionHours() {
        return highConsumptionHours;
    }

    public void setHighConsumptionHours(BigDecimal highConsumptionHours) {
        this.highConsumptionHours = highConsumptionHours;
    }

    public BigDecimal getEstimatedMonthlyCost() {
        return estimatedMonthlyCost;
    }

    public void setEstimatedMonthlyCost(BigDecimal estimatedMonthlyCost) {
        this.estimatedMonthlyCost = estimatedMonthlyCost;
    }

    public EfficiencyCategory getCategory() {
        return category;
    }

    public void setCategory(EfficiencyCategory category) {
        this.category = category;
    }

    public BigDecimal getProbability() {
        return probability;
    }

    public void setProbability(BigDecimal probability) {
        this.probability = probability;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
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

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public List<String> getRecommendations() {
        return List.copyOf(recommendations);
    }

    public void setRecommendations(List<String> recommendations) {
        this.recommendations = recommendations == null ? new ArrayList<>() : new ArrayList<>(recommendations);
    }
}
