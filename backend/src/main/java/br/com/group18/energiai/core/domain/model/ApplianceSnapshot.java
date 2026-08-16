package br.com.group18.energiai.core.domain.model;

import java.math.BigDecimal;

public class ApplianceSnapshot {

    private final String applianceName;
    private final String applianceCategory;
    private final Integer quantity;
    private final BigDecimal averagePowerWatts;
    private final BigDecimal averageDailyUseHours;
    private final BigDecimal monthlyConsumptionKwh;

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

    public String getApplianceName() {
        return applianceName;
    }

    public String getApplianceCategory() {
        return applianceCategory;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public BigDecimal getAveragePowerWatts() {
        return averagePowerWatts;
    }

    public BigDecimal getAverageDailyUseHours() {
        return averageDailyUseHours;
    }

    public BigDecimal getMonthlyConsumptionKwh() {
        return monthlyConsumptionKwh;
    }
}
