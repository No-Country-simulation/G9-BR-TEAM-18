package br.com.group18.energiai.core.ports.out;

import br.com.group18.energiai.core.domain.model.EnergyAnalysis;
import java.util.List;
import java.util.Optional;

public interface AnalysisRepositoryPort {
    EnergyAnalysis save(EnergyAnalysis analysis);

    Optional<EnergyAnalysis> findById(Long id);

    List<EnergyAnalysis> listByPropertyId(Long propertyId);

    List<EnergyAnalysis> listByPropertyIds(List<Long> propertyIds);

    void deleteById(Long id);
}
