package br.com.group18.energiai.infrastructure.adapters.out.persistence.mapper;

import br.com.group18.energiai.core.domain.model.Property;
import br.com.group18.energiai.infrastructure.adapters.out.persistence.entity.PropertyEntity;
import org.springframework.stereotype.Component;

@Component
public class PropertyMapper {

    public PropertyEntity toEntity(Property domain) {
        PropertyEntity entity = new PropertyEntity();
        entity.setId(domain.getId());
        entity.setUserId(domain.getUserId());
        entity.setAlias(domain.getAlias());
        entity.setPropertyType(domain.getPropertyType());
        entity.setActive(domain.isActive() ? 1 : 0);
        entity.setAddress(domain.getAddress());
        entity.setResidentCount(domain.getResidentCount());
        entity.setAreaSqm(domain.getAreaSqm());
        return entity;
    }

    public Property toDomain(PropertyEntity entity) {
        Property domain = new Property(entity.getUserId(), entity.getAlias(), entity.getPropertyType());
        domain.setId(entity.getId());
        domain.setActive(!Integer.valueOf(0).equals(entity.getActive()));
        domain.setAddress(entity.getAddress());
        domain.setResidentCount(entity.getResidentCount());
        domain.setAreaSqm(entity.getAreaSqm());
        return domain;
    }
}
