package br.com.group18.energiai.application.services;

import br.com.group18.energiai.application.dto.DashboardData;
import br.com.group18.energiai.application.dto.MonthlyConsumption;
import br.com.group18.energiai.core.domain.model.EnergyAnalysis;
import br.com.group18.energiai.core.domain.model.Property;
import br.com.group18.energiai.core.ports.out.AnalysisRepositoryPort;
import br.com.group18.energiai.core.ports.out.PropertyRepositoryPort;
import java.time.YearMonth;
import java.time.format.TextStyle;
import java.util.List;
import java.util.Locale;
import java.util.TreeMap;
import java.util.stream.Collectors;

public class DashboardService {

    private final PropertyRepositoryPort propertyRepository;
    private final AnalysisRepositoryPort analysisRepository;
    private final double co2EmissionFactor;

    public DashboardService(
            PropertyRepositoryPort propertyRepository,
            AnalysisRepositoryPort analysisRepository,
            double co2EmissionFactor) {
        this.propertyRepository = propertyRepository;
        this.analysisRepository = analysisRepository;
        this.co2EmissionFactor = co2EmissionFactor;
    }

    public DashboardData build(Long userId) {
        List<Long> propertyIds = propertyRepository.findByUserId(userId).stream()
                .map(Property::getId)
                .toList();
        List<EnergyAnalysis> analyses = analysisRepository.listByPropertyIds(propertyIds);
        if (analyses.isEmpty()) {
            return new DashboardData(0, 0.0, 0.0, 0.0, List.of());
        }

        double averageConsumptionKwh = analyses.stream()
                .map(EnergyAnalysis::getConsumptionKwh)
                .filter(java.util.Objects::nonNull)
                .mapToDouble(value -> value.doubleValue())
                .average()
                .orElse(0.0);
        double totalEstimatedCost = analyses.stream()
                .map(EnergyAnalysis::getEstimatedMonthlyCost)
                .filter(java.util.Objects::nonNull)
                .mapToDouble(value -> value.doubleValue())
                .sum();
        double totalCo2EmissionKg = analyses.stream()
                .map(EnergyAnalysis::getConsumptionKwh)
                .filter(java.util.Objects::nonNull)
                .mapToDouble(value -> value.doubleValue() * co2EmissionFactor)
                .sum();

        TreeMap<YearMonth, Double> consumptionByMonth = analyses.stream()
                .filter(analysis -> analysis.getCreatedAt() != null)
                .filter(analysis -> analysis.getConsumptionKwh() != null)
                .collect(Collectors.groupingBy(
                        analysis -> YearMonth.from(analysis.getCreatedAt()),
                        TreeMap::new,
                        Collectors.summingDouble(
                                analysis -> analysis.getConsumptionKwh().doubleValue())));
        List<MonthlyConsumption> monthlyConsumption = consumptionByMonth.entrySet().stream()
                .map(entry -> new MonthlyConsumption(
                        entry.getKey().getMonth().getDisplayName(TextStyle.SHORT, Locale.of("pt", "BR"))
                                + "/"
                                + entry.getKey().getYear(),
                        entry.getValue()))
                .toList();

        return new DashboardData(
                analyses.size(), averageConsumptionKwh, totalEstimatedCost, totalCo2EmissionKg, monthlyConsumption);
    }
}
