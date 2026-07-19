package br.com.group18.energiai.core.ports.out;

import br.com.group18.energiai.core.domain.model.Appliance;
import java.util.List;
import java.util.Optional;

public interface ApplianceRepositoryPort {

    List<Appliance> findAll();

    Optional<Appliance> findById(Long id);
}
