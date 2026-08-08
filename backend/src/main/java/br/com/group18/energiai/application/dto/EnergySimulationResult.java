package br.com.group18.energiai.application.dto;

import br.com.group18.energiai.core.domain.model.ApplianceSnapshot;
import br.com.group18.energiai.core.domain.valueobject.EfficiencyCategory;
import java.math.BigDecimal;
import java.util.List;

public record EnergySimulationResult(
        Long propertyId,
        BigDecimal consumptionKwh,
        Boolean peakHourUsage,
        BigDecimal highConsumptionHours,
        BigDecimal estimatedMonthlyCost,
        EfficiencyCategory category,
        BigDecimal probability,
        String source,
        List<String> recommendations,
        List<String> highestConsumptionProducts,
        List<ApplianceSnapshot> appliances) {}
