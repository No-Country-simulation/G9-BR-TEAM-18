package br.com.group18.energiai.infrastructure.adapters.out.persistence.mapper;

import br.com.group18.energiai.core.domain.model.PropertyAppliance;
import br.com.group18.energiai.infrastructure.adapters.out.persistence.entity.ApplianceEntity;
import br.com.group18.energiai.infrastructure.adapters.out.persistence.entity.PropertyApplianceEntity;
import org.springframework.stereotype.Component;

@Component
public class PropertyApplianceMapper {

    private final ApplianceMapper applianceMapper;

    public PropertyApplianceMapper(ApplianceMapper applianceMapper) {
        this.applianceMapper = applianceMapper;
    }

    public PropertyApplianceEntity toEntity(PropertyAppliance domain, ApplianceEntity appliance) {
        PropertyApplianceEntity entity = new PropertyApplianceEntity();
        entity.setId(domain.getId());
        entity.setPropertyId(domain.getPropertyId());
        entity.setAppliance(appliance);
        entity.setQuantity(domain.getQuantity());
        return entity;
    }

    public PropertyAppliance toDomain(PropertyApplianceEntity entity) {
        PropertyAppliance domain = new PropertyAppliance(
                entity.getPropertyId(), applianceMapper.toDomain(entity.getAppliance()), entity.getQuantity());
        domain.setId(entity.getId());
        return domain;
    }
}
