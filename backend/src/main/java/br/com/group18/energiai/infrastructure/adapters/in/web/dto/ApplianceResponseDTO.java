package br.com.group18.energiai.infrastructure.adapters.in.web.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;

@Schema(description = "Eletrodoméstico do catálogo do sistema")
public record ApplianceResponseDTO(
        @Schema(description = "Identificador único do eletrodoméstico", example = "1") Long id,
        @Schema(description = "Nome do eletrodoméstico", example = "Geladeira Frost Free") String name,
        @Schema(
                        description = "Categoria do eletrodoméstico",
                        example = "REFRIGERATION",
                        allowableValues = {"LIGHTING", "REFRIGERATION", "CLIMATE_CONTROL", "APPLIANCES", "TECHNOLOGY"})
                String applianceCategory,
        @Schema(description = "Potência média em Watts", example = "150.00") BigDecimal averagePowerWatts,
        @Schema(description = "Média de uso diário em horas", example = "8.0") BigDecimal averageDailyUseHours) {}
