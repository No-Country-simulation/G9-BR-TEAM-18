package br.com.group18.energiai.infrastructure.adapters.in.web.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Dados de uma propriedade")
public record PropertyResponseDTO(
        @Schema(description = "Identificador único da propriedade", example = "1") Long id,
        @Schema(description = "Apelido ou nome da propriedade", example = "Casa do João") String alias,
        @Schema(
                        description = "Tipo da propriedade",
                        example = "RESIDENCIAL",
                        allowableValues = {"RESIDENCIAL", "COMERCIAL"})
                String propertyType,
        @Schema(description = "Indica se a propriedade está ativa", example = "true") boolean active,
        @Schema(description = "Endereço da propriedade", example = "Rua das Flores, 123, Centro") String address,
        @Schema(description = "Número de moradores", example = "4") Integer residentCount,
        @Schema(description = "Área total em metros quadrados", example = "120.5") Double areaSqm) {}
