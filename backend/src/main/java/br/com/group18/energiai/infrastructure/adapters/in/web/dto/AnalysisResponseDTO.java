package br.com.group18.energiai.infrastructure.adapters.in.web.dto;

import br.com.group18.energiai.core.domain.valueobject.EfficiencyCategory;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record AnalysisResponseDTO(
        Long id,
        Long propertyId,
        BigDecimal consumptionKwh,
        Boolean peakHourUsage,
        BigDecimal highConsumptionHours,
        BigDecimal estimatedMonthlyCost,
        EfficiencyCategory category,
        BigDecimal probability,
        String status,
        List<String> recommendations,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {}
