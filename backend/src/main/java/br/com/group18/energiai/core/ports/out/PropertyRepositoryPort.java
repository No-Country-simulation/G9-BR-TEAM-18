package br.com.group18.energiai.core.ports.out;

import br.com.group18.energiai.core.domain.model.Property;
import java.util.List;
import java.util.Optional;

public interface PropertyRepositoryPort {

    Property save(Property property);

    Optional<Property> findById(Long id);

    List<Property> findByUserId(Long userId);

    void delete(Property property);
}
