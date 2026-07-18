package br.com.group18.energiai.core.ports.out;

import br.com.group18.energiai.core.domain.model.EnergyAnalysis;
import java.util.List;

public interface AnalysisRepositoryPort {
    EnergyAnalysis save(EnergyAnalysis analysis);

    List<EnergyAnalysis> listAll();

    List<EnergyAnalysis> listByUserId(Long userId);
}
