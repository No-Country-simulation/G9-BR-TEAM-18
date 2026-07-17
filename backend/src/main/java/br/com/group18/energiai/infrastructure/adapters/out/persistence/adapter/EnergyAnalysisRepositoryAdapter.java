package br.com.group18.energiai.infrastructure.adapters.out.persistence.adapter;

import br.com.group18.energiai.core.domain.model.EnergyAnalysis;
import br.com.group18.energiai.core.ports.out.AnalysisRepositoryPort;
import br.com.group18.energiai.infrastructure.adapters.out.persistence.mapper.EnergyAnalysisMapper;
import br.com.group18.energiai.infrastructure.adapters.out.persistence.repository.EnergyAnalysisJpaRepository;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;

@Component
public class EnergyAnalysisRepositoryAdapter implements AnalysisRepositoryPort {

    private final EnergyAnalysisJpaRepository jpaRepository;
    private final EnergyAnalysisMapper mapper;

    public EnergyAnalysisRepositoryAdapter(EnergyAnalysisJpaRepository jpaRepository, EnergyAnalysisMapper mapper) {
        this.jpaRepository = jpaRepository;
        this.mapper = mapper;
    }

    @Override
    public EnergyAnalysis save(EnergyAnalysis analysis) {
        var entity = mapper.toEntity(analysis);
        var saved = jpaRepository.save(entity);
        return mapper.toDomain(saved);
    }

    @Override
    public List<EnergyAnalysis> listAll() {
        return jpaRepository.findAll().stream().map(mapper::toDomain).collect(Collectors.toList());
    }
}
