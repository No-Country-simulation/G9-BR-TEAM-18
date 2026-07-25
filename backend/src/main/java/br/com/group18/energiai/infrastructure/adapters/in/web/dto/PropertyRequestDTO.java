package br.com.group18.energiai.infrastructure.adapters.in.web.dto;

import br.com.group18.energiai.core.domain.model.PropertyType;
import jakarta.validation.constraints.NotNull;

public class PropertyRequestDTO {

    @NotNull
    private String alias;

    @NotNull
    private PropertyType propertyType;

    private boolean active = true;

    private String address;

    private Integer residentCount;

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
