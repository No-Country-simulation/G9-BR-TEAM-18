package br.com.group18.energiai.infrastructure.adapters.in.web.dto;

import br.com.group18.energiai.core.domain.model.PropertyType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

@Schema(description = "Dados para criação ou atualização de uma propriedade")
public class PropertyRequestDTO {

    @NotNull
    @Schema(description = "Apelido ou nome da propriedade", example = "Casa do João")
    private String alias;

    @NotNull
    @Schema(
            description = "Tipo da propriedade",
            example = "RESIDENCIAL",
            allowableValues = {"RESIDENCIAL", "COMERCIAL"})
    private PropertyType propertyType;

    @Schema(description = "Indica se a propriedade está ativa", example = "true", defaultValue = "true")
    private boolean active = true;

    @Schema(description = "Endereço da propriedade", example = "Rua das Flores, 123, Centro")
    private String address;

    @Schema(description = "Número de moradores da propriedade", example = "4")
    private Integer residentCount;

    @Schema(description = "Área total da propriedade em metros quadrados", example = "120.5")
    private Double areaSqm;

    public String getAlias() {
        return alias;
    }

    public void setAlias(String alias) {
        this.alias = alias;
    }

    public PropertyType getPropertyType() {
        return propertyType;
    }

    public void setPropertyType(PropertyType propertyType) {
        this.propertyType = propertyType;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public Integer getResidentCount() {
        return residentCount;
    }

    public void setResidentCount(Integer residentCount) {
        this.residentCount = residentCount;
    }

    public Double getAreaSqm() {
        return areaSqm;
    }

    public void setAreaSqm(Double areaSqm) {
        this.areaSqm = areaSqm;
    }
}
