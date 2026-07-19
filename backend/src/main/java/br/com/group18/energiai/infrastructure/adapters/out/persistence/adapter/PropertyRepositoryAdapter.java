package br.com.group18.energiai.infrastructure.adapters.out.persistence.adapter;

import br.com.group18.energiai.core.domain.model.Property;
import br.com.group18.energiai.core.ports.out.PropertyRepositoryPort;
import br.com.group18.energiai.infrastructure.adapters.out.persistence.mapper.PropertyMapper;
import br.com.group18.energiai.infrastructure.adapters.out.persistence.repository.PropertyJpaRepository;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Component;

@Component
public class PropertyRepositoryAdapter implements PropertyRepositoryPort {

    private final PropertyJpaRepository repository;
    private final PropertyMapper mapper;

    public PropertyRepositoryAdapter(PropertyJpaRepository repository, PropertyMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    @Override
    public Property save(Property property) {
        return mapper.toDomain(repository.save(mapper.toEntity(property)));
    }

    @Override
    public Optional<Property> findById(Long id) {
        return repository.findById(id).map(mapper::toDomain);
    }

    @Override
    public List<Property> findByUserId(Long userId) {
        return repository.findByUserIdOrderByAliasAsc(userId).stream()
                .map(mapper::toDomain)
                .toList();
    }

    @Override
    public void delete(Property property) {
        repository.delete(mapper.toEntity(property));
    }
}
