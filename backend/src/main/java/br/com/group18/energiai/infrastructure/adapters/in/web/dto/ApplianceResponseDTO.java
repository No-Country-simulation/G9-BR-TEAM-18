package br.com.group18.energiai.infrastructure.adapters.in.web.dto;

import java.math.BigDecimal;

public record ApplianceResponseDTO(
        Long id,
        String name,
        String applianceCategory,
        BigDecimal averagePowerWatts,
        BigDecimal averageDailyUseHours) {}
