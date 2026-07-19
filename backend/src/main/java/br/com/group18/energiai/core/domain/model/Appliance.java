package br.com.group18.energiai.core.domain.model;

import java.math.BigDecimal;

/** Appliance catalog entry persisted in {@code tb_appliance}. */
public class Appliance {

    private Long id;
    private String name;
    private String applianceCategory;
    private BigDecimal averagePowerWatts;
    private BigDecimal averageDailyUseHours;

    public Appliance() {}

    public Appliance(
            Long id,
            String name,
            String applianceCategory,
            BigDecimal averagePowerWatts,
            BigDecimal averageDailyUseHours) {
        this.id = id;
        this.name = name;
        this.applianceCategory = applianceCategory;
        this.averagePowerWatts = averagePowerWatts;
        this.averageDailyUseHours = averageDailyUseHours;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getApplianceCategory() {
        return applianceCategory;
    }

    public void setApplianceCategory(String applianceCategory) {
        this.applianceCategory = applianceCategory;
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
}
