package br.com.group18.energiai.infrastructure.adapters.in.web.controllers;

import br.com.group18.energiai.application.services.ApplianceAggregationService;
import br.com.group18.energiai.core.domain.model.ApplianceItem;
import br.com.group18.energiai.core.domain.model.ApplianceType;
import br.com.group18.energiai.core.domain.model.EnergyAnalysis;
import br.com.group18.energiai.core.ports.in.GenerateAnalysisUseCase;
import br.com.group18.energiai.core.ports.out.AnalysisRepositoryPort;
import br.com.group18.energiai.infrastructure.adapters.in.web.dto.AnalysisRequestDTO;
import br.com.group18.energiai.infrastructure.adapters.in.web.dto.AnalysisResponseDTO;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.time.YearMonth;
import java.time.format.TextStyle;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.TreeMap;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AnalysisController {

    private static final Logger log = LoggerFactory.getLogger(AnalysisController.class);
    private final GenerateAnalysisUseCase generateAnalysisUseCase;
    private final AnalysisRepositoryPort analysisRepository;
    private final ApplianceAggregationService aggregationService;
    private final double co2EmissionFactor;

    public AnalysisController(
            GenerateAnalysisUseCase generateAnalysisUseCase,
            AnalysisRepositoryPort analysisRepository,
            ApplianceAggregationService aggregationService) {
        this.generateAnalysisUseCase = generateAnalysisUseCase;
        this.analysisRepository = analysisRepository;
        this.aggregationService = aggregationService;
        double factor = 0.096;
        try {
            factor = Double.parseDouble(System.getenv().getOrDefault("CO2_EMISSION_FACTOR", "0.096"));
        } catch (Exception e) {
            log.error("Invalid CO2_EMISSION_FACTOR, using default: {}", e.getMessage());
        }
        this.co2EmissionFactor = factor;
    }

    private AnalysisResponseDTO toResponse(EnergyAnalysis r) {
        AnalysisResponseDTO dto = new AnalysisResponseDTO();
        dto.setId(r.getId());
        dto.setCategory(r.getCategory());
        dto.setProbability(r.getProbability());
        dto.setRecommendations(r.getRecommendations());
        dto.setEstimatedMonthlyCost(r.getEstimatedMonthlyCost());
        dto.setSource(r.getSource());
        dto.setCreatedAt(r.getCreatedAt());
        dto.setHighestConsumptionCategory(r.getHighestConsumptionCategory());
        dto.setRefrigerationWatts(r.getRefrigerationWatts());
        dto.setHeatingWatts(r.getHeatingWatts());
        dto.setAirConditioningWatts(r.getAirConditioningWatts());
        dto.setLightingWatts(r.getLightingWatts());
        dto.setConsumptionKwh(r.getConsumptionKwh());
        dto.setTotalEquipment(r.getEquipmentQuantity());
        return dto;
    }

    @PostMapping("/energy-analysis")
    public ResponseEntity<AnalysisResponseDTO> analyze(
            @Valid @RequestBody AnalysisRequestDTO request, HttpServletRequest httpRequest) {
        Long userId = AuthController.getUserId(httpRequest);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Double consumptionKwh = request.getConsumptionKwh();
        Integer equipmentQuantity = request.getEquipmentQuantity();
        if (equipmentQuantity == null) equipmentQuantity = 0;
        String highestConsumptionCategory = request.getHighestConsumptionCategory();
        Double refrigeration = request.getRefrigerationWatts();
        Double heating = request.getHeatingWatts();
        Double airConditioning = request.getAirConditioningWatts();
        Double lighting = request.getLightingWatts();

        // If the user provided specific appliances, calculate automatically
        if (request.getAppliances() != null && !request.getAppliances().isEmpty()) {
            List<ApplianceItem> items = request.getAppliances().stream()
                    .map(a -> {
                        ApplianceType type = ApplianceType.valueOf(a.getType());
                        return new ApplianceItem(type, a.getQuantity());
                    })
                    .collect(Collectors.toList());

            var agg = aggregationService.aggregate(items);

            consumptionKwh = agg.calculatedConsumptionKwh();
            equipmentQuantity = agg.totalEquipment();
            highestConsumptionCategory = agg.highestConsumptionCategory();
            refrigeration = agg.consumptionDistribution().getOrDefault("REFRIGERATION_WATTS", 0.0);
            heating = agg.consumptionDistribution().getOrDefault("HEATING_WATTS", 0.0);
            airConditioning = agg.consumptionDistribution().getOrDefault("AIR_CONDITIONING_WATTS", 0.0);
            lighting = agg.consumptionDistribution().getOrDefault("LIGHTING_WATTS", 0.0);
        } else {
            // Fallback: use manual fields
            if (request.getDailyConsumptionDistribution() != null) {
                var dist = request.getDailyConsumptionDistribution();
                if (dist.getRefrigerationWatts() != null) refrigeration = dist.getRefrigerationWatts();
                if (dist.getHeatingWatts() != null) heating = dist.getHeatingWatts();
                if (dist.getAirConditioningWatts() != null) airConditioning = dist.getAirConditioningWatts();
                if (dist.getLightingWatts() != null) lighting = dist.getLightingWatts();
            }
        }

        EnergyAnalysis result = generateAnalysisUseCase.execute(
                userId,
                consumptionKwh,
                request.getPeakHourUsage(),
                equipmentQuantity,
                request.getPropertyType(),
                request.getHighConsumptionHours(),
                highestConsumptionCategory,
                refrigeration,
                heating,
                airConditioning,
                lighting);

        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(result));
    }

    @GetMapping("/appliances/types")
    public ResponseEntity<List<ApplianceTypeDTO>> listApplianceTypes() {
        List<ApplianceTypeDTO> types = Arrays.stream(ApplianceType.values())
                .map(t -> new ApplianceTypeDTO(
                        t.name(),
                        t.getDisplayName(),
                        t.getMlCategory(),
                        t.getDistributionField(),
                        t.getPowerWatts(),
                        t.getDailyUsageHours()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(types);
    }

    public record ApplianceTypeDTO(
            String id,
            String name,
            @JsonProperty("mlCategory") String mlCategory,
            @JsonProperty("distributionField") String distributionField,
            @JsonProperty("powerWatts") double powerWatts,
            @JsonProperty("dailyUsageHours") double dailyUsageHours) {}

    @GetMapping("/analyses")
    public ResponseEntity<List<AnalysisResponseDTO>> list(HttpServletRequest httpRequest) {
        Long userId = AuthController.getUserId(httpRequest);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        List<AnalysisResponseDTO> list = analysisRepository.listByUserId(userId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    @GetMapping("/dashboard")
    public ResponseEntity<DashboardDTO> dashboard(HttpServletRequest httpRequest) {
        Long userId = AuthController.getUserId(httpRequest);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        List<EnergyAnalysis> all = analysisRepository.listByUserId(userId);
        if (all.isEmpty()) {
            return ResponseEntity.ok(new DashboardDTO(0, 0.0, 0.0, 0.0, List.of()));
        }

        int totalAnalyses = all.size();
        double averageConsumptionKwh = all.stream()
                .mapToDouble(EnergyAnalysis::getConsumptionKwh)
                .average()
                .orElse(0.0);
        double totalEstimatedCost = all.stream()
                .mapToDouble(EnergyAnalysis::getEstimatedMonthlyCost)
                .sum();
        double totalCo2EmissionKg = all.stream()
                .mapToDouble(a -> a.getConsumptionKwh() * co2EmissionFactor)
                .sum();

        TreeMap<YearMonth, Double> consumptionByYearMonth = all.stream()
                .filter(a -> a.getCreatedAt() != null)
                .collect(Collectors.groupingBy(
                        a -> YearMonth.from(a.getCreatedAt()),
                        TreeMap::new,
                        Collectors.summingDouble(EnergyAnalysis::getConsumptionKwh)));

        List<MonthlyConsumptionDTO> monthlyConsumption = consumptionByYearMonth.entrySet().stream()
                .map(entry -> {
                    String monthName = entry.getKey().getMonth().getDisplayName(TextStyle.SHORT, Locale.of("pt", "BR"));
                    monthName = monthName.replace(".", "");
                    if (monthName.length() > 0) {
                        monthName = monthName.substring(0, 1).toUpperCase() + monthName.substring(1);
                    }
                    return new MonthlyConsumptionDTO(monthName, entry.getValue());
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(new DashboardDTO(
                totalAnalyses, averageConsumptionKwh, totalEstimatedCost, totalCo2EmissionKg, monthlyConsumption));
    }

    public record DashboardDTO(
            @JsonProperty("totalAnalyses") int totalAnalyses,
            @JsonProperty("averageConsumptionKwh") double averageConsumptionKwh,
            @JsonProperty("totalEstimatedCost") double totalEstimatedCost,
            @JsonProperty("totalCo2EmissionKg") double totalCo2EmissionKg,
            @JsonProperty("monthlyConsumption") List<MonthlyConsumptionDTO> monthlyConsumption) {}

    public record MonthlyConsumptionDTO(
            @JsonProperty("month") String month, @JsonProperty("consumptionKwh") double consumptionKwh) {}
}
