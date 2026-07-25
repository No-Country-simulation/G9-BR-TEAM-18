package br.com.group18.energiai.infrastructure.adapters.in.web.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;

@Schema(description = "Eletrodoméstico associado a uma propriedade com quantidades e consumo estimado")
public record PropertyApplianceResponseDTO(
        @Schema(description = "Identificador único da associação", example = "1") Long id,
        @Schema(description = "ID do eletrodoméstico no catálogo", example = "1") Long applianceId,
        @Schema(description = "Nome do eletrodoméstico", example = "Geladeira Frost Free") String applianceName,
        @Schema(description = "Categoria do eletrodoméstico", example = "REFRIGERATION") String applianceCategory,
        @Schema(description = "Quantidade deste eletrodoméstico", example = "2") Integer quantity,
        @Schema(description = "Potência média em Watts", example = "150.00") BigDecimal averagePowerWatts,
        @Schema(description = "Média de uso diário em horas", example = "8.0") BigDecimal averageDailyUseHours,
        @Schema(description = "Consumo mensal estimado em kWh", example = "72.00")
                BigDecimal estimatedMonthlyConsumptionKwh) {}
