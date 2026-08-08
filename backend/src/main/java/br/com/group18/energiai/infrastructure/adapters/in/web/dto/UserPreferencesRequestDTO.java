package br.com.group18.energiai.infrastructure.adapters.in.web.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;

@Schema(description = "Preferências do usuário para atualização parcial")
public class UserPreferencesRequestDTO {

    @Schema(description = "Meta de consumo mensal em kWh", example = "250.00")
    private BigDecimal consumptionGoal;

    @Schema(description = "Regularidade da análise", example = "instantanea")
    private String regularity;

    @Schema(description = "Indica se o usuário faz uso de energia no horário de pico (18h às 21h)", example = "true")
    private Boolean peakHourUsage;

    @Schema(description = "Quantidade de horas de alto consumo diário", example = "4.5")
    private BigDecimal highConsumptionHours;

    public BigDecimal getConsumptionGoal() {
        return consumptionGoal;
    }

    public void setConsumptionGoal(BigDecimal consumptionGoal) {
        this.consumptionGoal = consumptionGoal;
    }

    public String getRegularity() {
        return regularity;
    }

    public void setRegularity(String regularity) {
        this.regularity = regularity;
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
}
