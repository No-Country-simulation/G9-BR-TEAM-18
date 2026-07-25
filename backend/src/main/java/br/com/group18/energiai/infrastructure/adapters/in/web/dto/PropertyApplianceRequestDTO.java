package br.com.group18.energiai.infrastructure.adapters.in.web.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

@Schema(description = "Dados para adicionar ou atualizar um eletrodoméstico em uma propriedade")
public class PropertyApplianceRequestDTO {

    @NotNull
    @Positive
    @Schema(description = "ID do eletrodoméstico no catálogo", example = "1", minimum = "1")
    private Long applianceId;

    @NotNull
    @Positive
    @Schema(description = "Quantidade deste eletrodoméstico na propriedade", example = "2", minimum = "1")
    private Integer quantity;

    public Long getApplianceId() {
        return applianceId;
    }

    public void setApplianceId(Long applianceId) {
        this.applianceId = applianceId;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }
}
