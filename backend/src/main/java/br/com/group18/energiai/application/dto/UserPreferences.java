package br.com.group18.energiai.application.dto;

import java.math.BigDecimal;

public record UserPreferences(
        BigDecimal consumptionGoal, String regularity, Boolean peakHourUsage, BigDecimal highConsumptionHours) {}
