package br.com.group18.energiai.infrastructure.adapters.in.web.controllers;

import br.com.group18.energiai.application.dto.DashboardData;
import br.com.group18.energiai.application.dto.EnergySimulationResult;
import br.com.group18.energiai.application.exception.ResourceNotFoundException;
import br.com.group18.energiai.application.services.DashboardService;
import br.com.group18.energiai.application.services.EnergyAnalysisService;
import br.com.group18.energiai.application.services.PropertyService;
import br.com.group18.energiai.core.domain.model.EnergyAnalysis;
import br.com.group18.energiai.core.domain.model.Property;
import br.com.group18.energiai.core.ports.in.GenerateAnalysisUseCase;
import br.com.group18.energiai.core.ports.out.AnalysisRepositoryPort;
import br.com.group18.energiai.core.ports.out.MlContractPort;
import br.com.group18.energiai.infrastructure.adapters.in.web.dto.AnalysisRequestDTO;
import br.com.group18.energiai.infrastructure.adapters.in.web.dto.AnalysisResponseDTO;
import br.com.group18.energiai.infrastructure.adapters.in.web.security.SessionUserResolver;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.Comparator;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Análise Energética")
@RestController
public class AnalysisController {

    private static final String SIMULATED_STATUS = "SIMULADO";

    private final GenerateAnalysisUseCase generateAnalysisUseCase;
    private final EnergyAnalysisService energyAnalysisService;
    private final AnalysisRepositoryPort analysisRepository;
    private final PropertyService propertyService;
    private final MlContractPort mlContract;
    private final DashboardService dashboardService;

    public AnalysisController(
            GenerateAnalysisUseCase generateAnalysisUseCase,
            EnergyAnalysisService energyAnalysisService,
            AnalysisRepositoryPort analysisRepository,
            PropertyService propertyService,
            MlContractPort mlContract,
            DashboardService dashboardService) {
        this.generateAnalysisUseCase = generateAnalysisUseCase;
        this.energyAnalysisService = energyAnalysisService;
        this.analysisRepository = analysisRepository;
        this.propertyService = propertyService;
        this.mlContract = mlContract;
        this.dashboardService = dashboardService;
    }

    @Operation(
            summary = "Realizar análise energética",
            description = "Executa uma análise completa de eficiência energética para uma propriedade. "
                    + "Utiliza o serviço de Machine Learning para classificar a eficiência e gerar recomendações.")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Análise criada e classificada com sucesso"),
        @ApiResponse(
                responseCode = "503",
                description = "Serviço de ML indisponível no momento: análise pode usar fallback")
    })
    @SecurityRequirement(name = "sessionCookie")
    @PostMapping("/energy-analysis")
    public ResponseEntity<AnalysisResponseDTO> analyze(
            @Valid @RequestBody AnalysisRequestDTO request, HttpServletRequest httpRequest) {
        Long userId = SessionUserResolver.userId(httpRequest);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        Property property = propertyService.getOwned(request.getPropertyId(), userId);
        EnergyAnalysis result = generateAnalysisUseCase.execute(
                property,
                propertyService.listAppliances(property.getId(), userId),
                request.getConsumptionKwh(),
                request.getPeakHourUsage(),
                request.getHighConsumptionHours(),
                request.getHighestConsumptionCategory());
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(result));
    }

    @Operation(
            summary = "Simular análise energética",
            description = "Executa uma simulação de eficiência energética sem persistir o resultado. "
                    + "Útil para testar cenários antes de realizar a análise definitiva.")
    @ApiResponse(responseCode = "200", description = "Simulação concluída com sucesso")
    @SecurityRequirement(name = "sessionCookie")
    @PostMapping("/energy-analysis/simulate")
    public ResponseEntity<AnalysisResponseDTO> simulate(
            @Valid @RequestBody AnalysisRequestDTO request, HttpServletRequest httpRequest) {
        Long userId = SessionUserResolver.userId(httpRequest);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        Property property = propertyService.getOwned(request.getPropertyId(), userId);
        EnergySimulationResult result = energyAnalysisService.simulate(
                property,
                propertyService.listAppliances(property.getId(), userId),
                request.getConsumptionKwh(),
                request.getPeakHourUsage(),
                request.getHighConsumptionHours(),
                request.getHighestConsumptionCategory());
        return ResponseEntity.ok(toResponse(result));
    }

    @Operation(
            summary = "Listar análises do usuário",
            description =
                    "Retorna todas as análises energéticas realizadas pelo usuário em todas as suas propriedades.")
    @ApiResponse(responseCode = "200", description = "Lista de análises retornada")
    @SecurityRequirement(name = "sessionCookie")
    @GetMapping("/analyses")
    public ResponseEntity<List<AnalysisResponseDTO>> list(HttpServletRequest httpRequest) {
        Long userId = SessionUserResolver.userId(httpRequest);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(
                analysesForUser(userId).stream().map(this::toResponse).toList());
    }

    @Operation(
            summary = "Obter análise por ID",
            description = "Retorna os detalhes de uma análise específica pelo seu identificador.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Análise encontrada"),
        @ApiResponse(responseCode = "404", description = "Análise não encontrada")
    })
    @SecurityRequirement(name = "sessionCookie")
    @GetMapping("/analyses/{analysisId}")
    public ResponseEntity<AnalysisResponseDTO> getById(@PathVariable Long analysisId, HttpServletRequest httpRequest) {
        Long userId = SessionUserResolver.userId(httpRequest);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        EnergyAnalysis analysis = analysisRepository
                .findById(analysisId)
                .orElseThrow(() -> new ResourceNotFoundException("Análise não encontrada."));
        propertyService.getOwned(analysis.getPropertyId(), userId);
        return ResponseEntity.ok(toResponse(analysis));
    }

    @Operation(
            summary = "Obter dashboard do usuário",
            description = "Retorna um resumo consolidado com número total de análises, consumo médio, "
                    + "custo total estimado, emissão total de CO₂ e consumo mensal agregado.")
    @ApiResponse(responseCode = "200", description = "Dados do dashboard retornados")
    @SecurityRequirement(name = "sessionCookie")
    @GetMapping("/dashboard")
    public ResponseEntity<DashboardDTO> dashboard(HttpServletRequest httpRequest) {
        Long userId = SessionUserResolver.userId(httpRequest);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(toDashboard(dashboardService.build(userId)));
    }

    @Operation(
            summary = "Excluir análise",
            description =
                    "Remove uma análise energética pelo seu identificador. Apenas o proprietário da análise pode excluí-la.")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Análise excluída com sucesso"),
        @ApiResponse(responseCode = "404", description = "Análise não encontrada")
    })
    @SecurityRequirement(name = "sessionCookie")
    @DeleteMapping("/analyses/{analysisId}")
    public ResponseEntity<Void> delete(@PathVariable Long analysisId, HttpServletRequest httpRequest) {
        Long userId = SessionUserResolver.userId(httpRequest);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        EnergyAnalysis analysis = analysisRepository
                .findById(analysisId)
                .orElseThrow(() -> new ResourceNotFoundException("Análise não encontrada."));
        propertyService.getOwned(analysis.getPropertyId(), userId);
        analysisRepository.deleteById(analysisId);
        return ResponseEntity.noContent().build();
    }

    @Operation(
            summary = "Listar categorias de eficiência",
            description =
                    "Retorna as categorias de classificação energética disponíveis no serviço de Machine Learning.")
    @ApiResponse(responseCode = "200", description = "Lista de categorias retornada")
    @GetMapping("/energy-analysis/categories")
    public ResponseEntity<List<String>> getCategories() {
        return ResponseEntity.ok(mlContract.efficiencyCategories());
    }

    private List<EnergyAnalysis> analysesForUser(Long userId) {
        List<Long> propertyIds = propertyService.listByUserId(userId).stream()
                .map(Property::getId)
                .toList();
        return analysisRepository.listByPropertyIds(propertyIds);
    }

    private AnalysisResponseDTO toResponse(EnergyAnalysis analysis) {
        List<AnalysisResponseDTO.ApplianceSnapshotDTO> snapshots = toSnapshots(analysis.getAppliancesSnapshot());
        return new AnalysisResponseDTO(
                analysis.getId(),
                analysis.getPropertyId(),
                analysis.getConsumptionKwh(),
                analysis.getPeakHourUsage(),
                analysis.getHighConsumptionHours(),
                analysis.getEstimatedMonthlyCost(),
                category(analysis.getCategory()),
                analysis.getProbability(),
                analysis.getStatus(),
                analysis.getSource(),
                analysis.getRecommendations(),
                highestConsumptionProducts(snapshots),
                analysis.getCreatedAt(),
                analysis.getUpdatedAt(),
                snapshots);
    }

    private AnalysisResponseDTO toResponse(EnergySimulationResult result) {
        return new AnalysisResponseDTO(
                null,
                result.propertyId(),
                result.consumptionKwh(),
                result.peakHourUsage(),
                result.highConsumptionHours(),
                result.estimatedMonthlyCost(),
                result.category().value(),
                result.probability(),
                SIMULATED_STATUS,
                result.source(),
                result.recommendations(),
                result.highestConsumptionProducts(),
                null,
                null,
                toSnapshots(result.appliances()));
    }

    private DashboardDTO toDashboard(DashboardData data) {
        List<MonthlyConsumptionDTO> monthlyConsumption = data.monthlyConsumption().stream()
                .map(month -> new MonthlyConsumptionDTO(month.month(), month.consumptionKwh()))
                .toList();
        return new DashboardDTO(
                data.totalAnalyses(),
                data.averageConsumptionKwh(),
                data.totalEstimatedCost(),
                data.totalCo2EmissionKg(),
                monthlyConsumption);
    }

    private List<AnalysisResponseDTO.ApplianceSnapshotDTO> toSnapshots(
            List<br.com.group18.energiai.core.domain.model.ApplianceSnapshot> snapshots) {
        return snapshots.stream()
                .map(snapshot -> new AnalysisResponseDTO.ApplianceSnapshotDTO(
                        snapshot.getApplianceName(),
                        snapshot.getApplianceCategory(),
                        snapshot.getQuantity(),
                        snapshot.getAveragePowerWatts(),
                        snapshot.getAverageDailyUseHours(),
                        snapshot.getMonthlyConsumptionKwh()))
                .toList();
    }

    private List<String> highestConsumptionProducts(List<AnalysisResponseDTO.ApplianceSnapshotDTO> snapshots) {
        return snapshots.stream()
                .sorted(Comparator.comparing(
                        AnalysisResponseDTO.ApplianceSnapshotDTO::monthlyConsumptionKwh,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(3)
                .map(AnalysisResponseDTO.ApplianceSnapshotDTO::name)
                .toList();
    }

    private String category(br.com.group18.energiai.core.domain.valueobject.EfficiencyCategory category) {
        return category == null ? null : category.value();
    }

    @Schema(description = "Dados consolidados do dashboard do usuário")
    public record DashboardDTO(
            @Schema(description = "Número total de análises realizadas", example = "15") int totalAnalyses,
            @Schema(description = "Consumo médio em kWh entre todas as análises", example = "320.5")
                    double averageConsumptionKwh,
            @Schema(description = "Custo total estimado acumulado em R$", example = "3500.75")
                    double totalEstimatedCost,
            @Schema(description = "Emissão total de CO₂ em kg", example = "125.8") double totalCo2EmissionKg,
            @Schema(description = "Consumo agregado por mês") List<MonthlyConsumptionDTO> monthlyConsumption) {}

    @Schema(description = "Consumo mensal agregado para o dashboard")
    public record MonthlyConsumptionDTO(
            @Schema(description = "Mês/ano no formato 'Mmm/AAAA'", example = "Jul/2026") String month,
            @Schema(description = "Consumo total do mês em kWh", example = "350.0") double consumptionKwh) {}
}
