package br.com.group18.energiai.infrastructure.adapters.in.web.dto;

import java.math.BigDecimal;

public record PropertyApplianceResponseDTO(
        Long id,
        Long applianceId,
        String applianceName,
        String applianceCategory,
        Integer quantity,
        BigDecimal averagePowerWatts,
        BigDecimal averageDailyUseHours,
        BigDecimal estimatedMonthlyConsumptionKwh) {}
