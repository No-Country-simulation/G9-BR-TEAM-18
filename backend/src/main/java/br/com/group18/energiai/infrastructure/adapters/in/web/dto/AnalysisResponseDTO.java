package br.com.group18.energiai.infrastructure.adapters.in.web.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Schema(description = "Resultado de uma análise energética")
public record AnalysisResponseDTO(
        @Schema(description = "Identificador único da análise", example = "1") Long id,
        @Schema(description = "ID da propriedade analisada", example = "1") Long propertyId,
        @Schema(description = "Consumo mensal informado em kWh", example = "350.75") BigDecimal consumptionKwh,
        @Schema(description = "Indica se houve uso no horário de pico", example = "true") Boolean peakHourUsage,
        @Schema(description = "Horas de alto consumo por dia informadas", example = "5.5")
                BigDecimal highConsumptionHours,
        @Schema(description = "Custo mensal estimado em R$", example = "210.45") BigDecimal estimatedMonthlyCost,
        @Schema(
                        description = "Classificação de eficiência energética",
                        example = "BOM",
                        allowableValues = {"EXCELENTE", "BOM", "MEDIANO", "RUIM", "CRITICO"})
                String category,
        @Schema(description = "Probabilidade da classificação (0 a 1)", example = "0.85") BigDecimal probability,
        @Schema(
                        description = "Status da análise",
                        example = "CONCLUIDA",
                        allowableValues = {"PENDENTE", "CONCLUIDA", "FALHA", "SIMULADO"})
                String status,
        @Schema(
                        description = "Fonte da classificação (contrato do ML Service - docs/contrato-api.md): 'model' "
                                + "(classificador treinado), 'model+groq' (com fallback LLM) ou 'rule-based' (fallback por regras). "
                                + "Em runtime, os valores podem vir com sufixos descritivos, ex.: "
                                + "'model (confidence 62.5%)' ou 'rule-based (model error)'",
                        example = "model",
                        allowableValues = {"model", "model+groq", "rule-based"})
                String source,
        @Schema(description = "Recomendações para melhoria da eficiência") List<String> recommendations,
        @Schema(description = "Lista dos 3 equipamentos de maior consumo no momento da análise")
                List<String> highestConsumptionProducts,
        @Schema(description = "Data e hora da criação da análise", example = "2026-07-25T10:30:00")
                LocalDateTime createdAt,
        @Schema(description = "Data e hora da última atualização", example = "2026-07-25T10:30:00")
                LocalDateTime updatedAt,
        @Schema(description = "Lista de equipamentos capturados no momento da análise")
                List<ApplianceSnapshotDTO> appliances) {

    @Schema(description = "Snapshot de um equipamento no momento da análise")
    public record ApplianceSnapshotDTO(
            @Schema(description = "Nome do equipamento", example = "Geladeira") String name,
            @Schema(description = "Categoria do equipamento", example = "Refrigeração") String category,
            @Schema(description = "Quantidade", example = "2") Integer quantity,
            @Schema(description = "Potência média em watts", example = "150.0") BigDecimal averagePowerWatts,
            @Schema(description = "Média de horas de uso por dia", example = "24.0") BigDecimal averageDailyUseHours,
            @Schema(description = "Consumo mensal estimado em kWh", example = "108.0")
                    BigDecimal monthlyConsumptionKwh) {}
}
