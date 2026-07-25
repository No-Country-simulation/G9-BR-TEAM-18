package br.com.group18.energiai.infrastructure.adapters.in.web.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

@Schema(description = "Dados para realizar uma análise energética")
public class AnalysisRequestDTO {

    @NotNull
    @Positive
    @Schema(description = "ID da propriedade a ser analisada", example = "1", minimum = "1")
    private Long propertyId;

    @NotNull
    @DecimalMin(value = "0.01")
    @DecimalMax(value = "99999999.99")
    @Digits(integer = 8, fraction = 2)
    @Schema(description = "Consumo mensal em kWh", example = "350.75", minimum = "0.01", maximum = "99999999.99")
    private BigDecimal consumptionKwh;

    @NotNull
    @Schema(description = "Indica se há uso no horário de pico", example = "true")
    private Boolean peakHourUsage;

    @NotNull
    @DecimalMin(value = "0.00")
    @DecimalMax(value = "99.99")
    @Digits(integer = 2, fraction = 2)
    @Schema(description = "Horas de alto consumo por dia", example = "5.5", minimum = "0.0", maximum = "99.99")
    private BigDecimal highConsumptionHours;

    @Schema(
            description = "Categoria de maior consumo (opcional, inferida se não informada)",
            example = "REFRIGERATION",
            nullable = true)
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
