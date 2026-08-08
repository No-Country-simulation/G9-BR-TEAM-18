package br.com.group18.energiai.application.dto;

import java.util.List;

public record DashboardData(
        int totalAnalyses,
        double averageConsumptionKwh,
        double totalEstimatedCost,
        double totalCo2EmissionKg,
        List<MonthlyConsumption> monthlyConsumption) {}
