package br.com.group18.energiai.core.ports.out;

import br.com.group18.energiai.core.domain.model.PropertyAppliance;
import java.util.List;
import java.util.Optional;

public interface PropertyApplianceRepositoryPort {

    PropertyAppliance save(PropertyAppliance propertyAppliance);

    List<PropertyAppliance> findByPropertyId(Long propertyId);

    Optional<PropertyAppliance> findByPropertyIdAndApplianceId(Long propertyId, Long applianceId);

    void delete(PropertyAppliance propertyAppliance);
}
