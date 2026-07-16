package br.com.group18.energiai.infrastructure.adapters.out.persistence.adapter;

import br.com.group18.energiai.core.domain.model.AnaliseEnergia;
import br.com.group18.energiai.core.ports.out.AnaliseRepositoryPort;
import br.com.group18.energiai.infrastructure.adapters.out.persistence.mapper.AnaliseEnergiaMapper;
import br.com.group18.energiai.infrastructure.adapters.out.persistence.repository.AnaliseEnergiaJpaRepository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class AnaliseEnergiaRepositoryAdapter implements AnaliseRepositoryPort {

    private final AnaliseEnergiaJpaRepository jpaRepository;
    private final AnaliseEnergiaMapper mapper;

    public AnaliseEnergiaRepositoryAdapter(AnaliseEnergiaJpaRepository jpaRepository,
                                           AnaliseEnergiaMapper mapper) {
        this.jpaRepository = jpaRepository;
        this.mapper = mapper;
    }

    @Override
    public AnaliseEnergia salvar(AnaliseEnergia analise) {
        var entity = mapper.toEntity(analise);
        var saved = jpaRepository.save(entity);
        return mapper.toDomain(saved);
    }

    @Override
    public List<AnaliseEnergia> listarTodas() {
        return jpaRepository.findAll()
                .stream()
                .map(mapper::toDomain)
                .collect(Collectors.toList());
    }
}
