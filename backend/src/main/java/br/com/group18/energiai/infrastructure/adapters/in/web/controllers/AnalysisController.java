package br.com.group18.energiai.infrastructure.adapters.in.web.controllers;

import br.com.group18.energiai.application.exception.ResourceNotFoundException;
import br.com.group18.energiai.application.services.PropertyService;
import br.com.group18.energiai.core.domain.model.EnergyAnalysis;
import br.com.group18.energiai.core.domain.model.Property;
import br.com.group18.energiai.core.ports.in.GenerateAnalysisUseCase;
import br.com.group18.energiai.core.ports.out.AnalysisRepositoryPort;
import br.com.group18.energiai.infrastructure.adapters.in.web.dto.AnalysisRequestDTO;
import br.com.group18.energiai.infrastructure.adapters.in.web.dto.AnalysisResponseDTO;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.time.YearMonth;
import java.time.format.TextStyle;
import java.util.List;
import java.util.Locale;
import java.util.TreeMap;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AnalysisController {

    private final GenerateAnalysisUseCase generateAnalysisUseCase;
    private final AnalysisRepositoryPort analysisRepository;
    private final PropertyService propertyService;
    private final double co2EmissionFactor;

    public AnalysisController(
            GenerateAnalysisUseCase generateAnalysisUseCase,
            AnalysisRepositoryPort analysisRepository,
            PropertyService propertyService,
            @Value("${CO2_EMISSION_FACTOR:0.096}") double co2EmissionFactor) {
        this.generateAnalysisUseCase = generateAnalysisUseCase;
        this.analysisRepository = analysisRepository;
        this.propertyService = propertyService;
        this.co2EmissionFactor = co2EmissionFactor;
    }

    @PostMapping("/energy-analysis")
    public ResponseEntity<AnalysisResponseDTO> analyze(
            @Valid @RequestBody AnalysisRequestDTO request, HttpServletRequest httpRequest) {
        Long userId = AuthController.getUserId(httpRequest);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Property property = propertyService.getOwned(request.getPropertyId(), userId);
        EnergyAnalysis result = generateAnalysisUseCase.execute(
                property,
                propertyService.listAppliances(property.getId(), userId),
                request.getConsumptionKwh(),
                request.getPeakHourUsage(),
                request.getHighConsumptionHours());
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(result));
    }

    @GetMapping("/analyses")
    public ResponseEntity<List<AnalysisResponseDTO>> list(HttpServletRequest httpRequest) {
        Long userId = AuthController.getUserId(httpRequest);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(analysesForUser(userId).stream().map(this::toResponse).toList());
    }

    @GetMapping("/analyses/{analysisId}")
    public ResponseEntity<AnalysisResponseDTO> getById(
            @PathVariable Long analysisId, HttpServletRequest httpRequest) {
        Long userId = AuthController.getUserId(httpRequest);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        EnergyAnalysis analysis = analysisRepository
                .findById(analysisId)
                .orElseThrow(() -> new ResourceNotFoundException("Análise não encontrada."));
        propertyService.getOwned(analysis.getPropertyId(), userId);
        return ResponseEntity.ok(toResponse(analysis));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<DashboardDTO> dashboard(HttpServletRequest httpRequest) {
        Long userId = AuthController.getUserId(httpRequest);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        List<EnergyAnalysis> analyses = analysesForUser(userId);
        if (analyses.isEmpty()) {
            return ResponseEntity.ok(new DashboardDTO(0, 0.0, 0.0, 0.0, List.of()));
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
                .collect(Collectors.groupingBy(
                        analysis -> YearMonth.from(analysis.getCreatedAt()),
                        TreeMap::new,
                        Collectors.summingDouble(analysis -> analysis.getConsumptionKwh().doubleValue())));
        List<MonthlyConsumptionDTO> monthlyConsumption = consumptionByMonth.entrySet().stream()
                .map(entry -> new MonthlyConsumptionDTO(
                        entry.getKey().getMonth().getDisplayName(TextStyle.SHORT, Locale.of("pt", "BR"))
                                + "/"
                                + entry.getKey().getYear(),
                        entry.getValue()))
                .toList();

        return ResponseEntity.ok(new DashboardDTO(
                analyses.size(), averageConsumptionKwh, totalEstimatedCost, totalCo2EmissionKg, monthlyConsumption));
    }

    private List<EnergyAnalysis> analysesForUser(Long userId) {
        List<Long> propertyIds = propertyService.listByUserId(userId).stream().map(Property::getId).toList();
        return analysisRepository.listByPropertyIds(propertyIds);
    }

    private AnalysisResponseDTO toResponse(EnergyAnalysis analysis) {
        return new AnalysisResponseDTO(
                analysis.getId(),
                analysis.getPropertyId(),
                analysis.getConsumptionKwh(),
                analysis.getPeakHourUsage(),
                analysis.getHighConsumptionHours(),
                analysis.getEstimatedMonthlyCost(),
                analysis.getCategory(),
                analysis.getProbability(),
                analysis.getStatus(),
                analysis.getRecommendations(),
                analysis.getCreatedAt(),
                analysis.getUpdatedAt());
    }

    public record DashboardDTO(
            int totalAnalyses,
            double averageConsumptionKwh,
            double totalEstimatedCost,
            double totalCo2EmissionKg,
            List<MonthlyConsumptionDTO> monthlyConsumption) {}

    public record MonthlyConsumptionDTO(String month, double consumptionKwh) {}
}
