package br.com.group18.energiai.infrastructure.adapters.out.persistence.mapper;

import br.com.group18.energiai.core.domain.model.Appliance;
import br.com.group18.energiai.infrastructure.adapters.out.persistence.entity.ApplianceEntity;
import org.springframework.stereotype.Component;

@Component
public class ApplianceMapper {

    public Appliance toDomain(ApplianceEntity entity) {
        return new Appliance(
                entity.getId(),
                entity.getName(),
                entity.getApplianceCategory(),
                entity.getAveragePowerWatts(),
                entity.getAverageDailyUseHours());
    }
}
