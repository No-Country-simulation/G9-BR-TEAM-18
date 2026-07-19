package br.com.group18.energiai.infrastructure.adapters.out.persistence.adapter;

import br.com.group18.energiai.core.domain.model.PropertyAppliance;
import br.com.group18.energiai.core.ports.out.PropertyApplianceRepositoryPort;
import br.com.group18.energiai.infrastructure.adapters.out.persistence.entity.ApplianceEntity;
import br.com.group18.energiai.infrastructure.adapters.out.persistence.mapper.PropertyApplianceMapper;
import br.com.group18.energiai.infrastructure.adapters.out.persistence.repository.ApplianceJpaRepository;
import br.com.group18.energiai.infrastructure.adapters.out.persistence.repository.PropertyApplianceJpaRepository;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Component;

@Component
public class PropertyApplianceRepositoryAdapter implements PropertyApplianceRepositoryPort {

    private final PropertyApplianceJpaRepository repository;
    private final ApplianceJpaRepository applianceRepository;
    private final PropertyApplianceMapper mapper;

    public PropertyApplianceRepositoryAdapter(
            PropertyApplianceJpaRepository repository,
            ApplianceJpaRepository applianceRepository,
            PropertyApplianceMapper mapper) {
        this.repository = repository;
        this.applianceRepository = applianceRepository;
        this.mapper = mapper;
    }

    @Override
    public PropertyAppliance save(PropertyAppliance propertyAppliance) {
        ApplianceEntity appliance = applianceRepository.getReferenceById(
                propertyAppliance.getAppliance().getId());
        return mapper.toDomain(repository.save(mapper.toEntity(propertyAppliance, appliance)));
    }

    @Override
    public List<PropertyAppliance> findByPropertyId(Long propertyId) {
        return repository.findByPropertyIdOrderByIdAsc(propertyId).stream()
                .map(mapper::toDomain)
                .toList();
    }

    @Override
    public Optional<PropertyAppliance> findByPropertyIdAndApplianceId(Long propertyId, Long applianceId) {
        return repository
                .findByPropertyIdAndAppliance_Id(propertyId, applianceId)
                .map(mapper::toDomain);
    }

    @Override
    public void delete(PropertyAppliance propertyAppliance) {
        repository.delete(mapper.toEntity(
                propertyAppliance,
                applianceRepository.getReferenceById(
                        propertyAppliance.getAppliance().getId())));
    }
}
