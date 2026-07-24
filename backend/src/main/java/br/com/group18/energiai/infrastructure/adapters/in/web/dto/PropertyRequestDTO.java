package br.com.group18.energiai.infrastructure.adapters.in.web.dto;

import br.com.group18.energiai.core.domain.model.TipoImovel;
import jakarta.validation.constraints.NotNull;

public class PropertyRequestDTO {

    @NotNull
    private String alias;

    @NotNull
    private TipoImovel propertyType;

    private boolean active = true;

    public String getAlias() {
        return alias;
    }

    public void setAlias(String alias) {
        this.alias = alias;
    }

    public TipoImovel getPropertyType() {
        return propertyType;
    }

    public void setPropertyType(TipoImovel propertyType) {
        this.propertyType = propertyType;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}
