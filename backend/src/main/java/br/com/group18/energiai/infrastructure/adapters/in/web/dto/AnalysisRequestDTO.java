package br.com.group18.energiai.infrastructure.adapters.in.web.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

public class AnalysisRequestDTO {

    @NotNull
    @Positive
    private Long propertyId;

    @NotNull
    @DecimalMin(value = "0.01")
    @DecimalMax(value = "99999999.99")
    @Digits(integer = 8, fraction = 2)
    private BigDecimal consumptionKwh;

    @NotNull
    private Boolean peakHourUsage;

    @NotNull
    @DecimalMin(value = "0.00")
    @DecimalMax(value = "99.99")
    @Digits(integer = 2, fraction = 2)
    private BigDecimal highConsumptionHours;

    private String highestConsumptionCategory;

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

    public String getHighestConsumptionCategory() {
        return highestConsumptionCategory;
    }

    public void setHighestConsumptionCategory(String highestConsumptionCategory) {
        this.highestConsumptionCategory = highestConsumptionCategory;
    }
}
