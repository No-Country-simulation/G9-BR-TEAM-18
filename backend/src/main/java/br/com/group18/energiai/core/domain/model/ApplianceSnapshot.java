package br.com.group18.energiai.core.domain.model;

import java.math.BigDecimal;

public class ApplianceSnapshot {

    private Long id;
    private String applianceName;
    private String applianceCategory;
    private Integer quantity;
    private BigDecimal averagePowerWatts;
    private BigDecimal averageDailyUseHours;
    private BigDecimal monthlyConsumptionKwh;

    public ApplianceSnapshot() {}

    public ApplianceSnapshot(
            String applianceName,
            String applianceCategory,
            Integer quantity,
            BigDecimal averagePowerWatts,
            BigDecimal averageDailyUseHours,
            BigDecimal monthlyConsumptionKwh) {
        this.applianceName = applianceName;
        this.applianceCategory = applianceCategory;
        this.quantity = quantity;
        this.averagePowerWatts = averagePowerWatts;
        this.averageDailyUseHours = averageDailyUseHours;
        this.monthlyConsumptionKwh = monthlyConsumptionKwh;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getApplianceName() {
        return applianceName;
    }

    public void setApplianceName(String applianceName) {
        this.applianceName = applianceName;
    }

    public String getApplianceCategory() {
        return applianceCategory;
    }

    public void setApplianceCategory(String applianceCategory) {
        this.applianceCategory = applianceCategory;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public BigDecimal getAveragePowerWatts() {
        return averagePowerWatts;
    }

    public void setAveragePowerWatts(BigDecimal averagePowerWatts) {
        this.averagePowerWatts = averagePowerWatts;
    }

    public BigDecimal getAverageDailyUseHours() {
        return averageDailyUseHours;
    }

    public void setAverageDailyUseHours(BigDecimal averageDailyUseHours) {
        this.averageDailyUseHours = averageDailyUseHours;
    }

    public BigDecimal getMonthlyConsumptionKwh() {
        return monthlyConsumptionKwh;
    }

    public void setMonthlyConsumptionKwh(BigDecimal monthlyConsumptionKwh) {
        this.monthlyConsumptionKwh = monthlyConsumptionKwh;
    }
}
