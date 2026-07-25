package br.com.group18.energiai.core.domain.model;

import java.math.BigDecimal;
import java.math.RoundingMode;

public class PropertyAppliance {

    private static final BigDecimal DAYS_PER_MONTH = BigDecimal.valueOf(30);
    private static final BigDecimal WATTS_PER_KILOWATT = BigDecimal.valueOf(1000);

    private Long id;
    private Long propertyId;
    private Appliance appliance;
    private Integer quantity;

    public PropertyAppliance() {}

    public PropertyAppliance(Long propertyId, Appliance appliance, Integer quantity) {
        this.propertyId = propertyId;
        this.appliance = appliance;
        this.quantity = quantity;
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

    public Appliance getAppliance() {
        return appliance;
    }

    public void setAppliance(Appliance appliance) {
        this.appliance = appliance;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public BigDecimal getMonthlyConsumptionKwh() {
        if (appliance == null
                || appliance.getAveragePowerWatts() == null
                || appliance.getAverageDailyUseHours() == null
                || quantity == null) {
            return BigDecimal.ZERO.setScale(2);
        }
        return appliance
                .getAveragePowerWatts()
                .multiply(appliance.getAverageDailyUseHours())
                .multiply(BigDecimal.valueOf(quantity))
                .multiply(DAYS_PER_MONTH)
                .divide(WATTS_PER_KILOWATT, 2, RoundingMode.HALF_UP);
    }

    public BigDecimal getTotalPowerWatts() {
        if (appliance == null || appliance.getAveragePowerWatts() == null || quantity == null) {
            return BigDecimal.ZERO.setScale(2);
        }
        return appliance.getAveragePowerWatts().multiply(BigDecimal.valueOf(quantity));
    }
}
