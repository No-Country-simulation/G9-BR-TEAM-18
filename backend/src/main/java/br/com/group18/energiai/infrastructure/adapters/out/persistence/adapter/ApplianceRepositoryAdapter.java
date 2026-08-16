package br.com.group18.energiai.infrastructure.adapters.out.persistence.adapter;

import br.com.group18.energiai.core.domain.model.Appliance;
import br.com.group18.energiai.core.ports.out.ApplianceRepositoryPort;
import br.com.group18.energiai.infrastructure.adapters.out.persistence.mapper.ApplianceMapper;
import br.com.group18.energiai.infrastructure.adapters.out.persistence.repository.ApplianceJpaRepository;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Component;

@Component
public class ApplianceRepositoryAdapter implements ApplianceRepositoryPort {

    private final ApplianceJpaRepository repository;
    private final ApplianceMapper mapper;

    public ApplianceRepositoryAdapter(ApplianceJpaRepository repository, ApplianceMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    @Override
    public List<Appliance> findAll() {
        return repository.findAllByOrderByNameAsc().stream()
                .map(mapper::toDomain)
                .toList();
    }

    @Override
    public Optional<Appliance> findById(Long id) {
        return repository.findById(id).map(mapper::toDomain);
    }

    @Override
    public Appliance save(Appliance appliance) {
        return mapper.toDomain(repository.save(mapper.toEntity(appliance)));
    }
}
