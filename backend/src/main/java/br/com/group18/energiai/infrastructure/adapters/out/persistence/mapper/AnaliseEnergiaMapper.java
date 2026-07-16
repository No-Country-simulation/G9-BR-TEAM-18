package br.com.group18.energiai.infrastructure.adapters.out.persistence.mapper;

import br.com.group18.energiai.core.domain.model.AnaliseEnergia;
import br.com.group18.energiai.infrastructure.adapters.out.persistence.entity.AnaliseEnergiaEntity;
import org.springframework.stereotype.Component;

@Component
public class AnaliseEnergiaMapper {

    public AnaliseEnergiaEntity toEntity(AnaliseEnergia domain) {
        if (domain == null) return null;

        AnaliseEnergiaEntity entity = new AnaliseEnergiaEntity();
        entity.setId(domain.getId());
        entity.setConsumoKwh(domain.getConsumoKwh());
        entity.setUsoHorarioPico(domain.getUsoHorarioPico());
        entity.setQuantidadeEquipamentos(domain.getQuantidadeEquipamentos());
        entity.setTipoImovel(domain.getTipoImovel());
        entity.setHorasAltoConsumo(domain.getHorasAltoConsumo());
        entity.setCategoriaMaiorConsumo(domain.getCategoriaMaiorConsumo());
        entity.setRefrigWatts(domain.getRefrigWatts());
        entity.setAquecimentoWatts(domain.getAquecimentoWatts());
        entity.setClimatizacaoWatts(domain.getClimatizacaoWatts());
        entity.setIluminacaoWatts(domain.getIluminacaoWatts());
        entity.setCategoria(domain.getCategoria());
        entity.setProbabilidade(domain.getProbabilidade());
        entity.setCustoEstimadoMensal(domain.getCustoEstimadoMensal());
        entity.setRecomendacoes(domain.getRecomendacoes());
        entity.setOrigem(domain.getOrigem());
        entity.setCreatedAt(domain.getCreatedAt());
        return entity;
    }

    public AnaliseEnergia toDomain(AnaliseEnergiaEntity entity) {
        if (entity == null) return null;

        AnaliseEnergia domain = new AnaliseEnergia(
                entity.getConsumoKwh(),
                entity.getUsoHorarioPico(),
                entity.getQuantidadeEquipamentos(),
                entity.getTipoImovel(),
                entity.getHorasAltoConsumo()
        );
        domain.setId(entity.getId());
        domain.setCategoriaMaiorConsumo(entity.getCategoriaMaiorConsumo());
        domain.setRefrigWatts(entity.getRefrigWatts());
        domain.setAquecimentoWatts(entity.getAquecimentoWatts());
        domain.setClimatizacaoWatts(entity.getClimatizacaoWatts());
        domain.setIluminacaoWatts(entity.getIluminacaoWatts());
        domain.setCategoria(entity.getCategoria());
        domain.setProbabilidade(entity.getProbabilidade());
        domain.setCustoEstimadoMensal(entity.getCustoEstimadoMensal());
        domain.setRecomendacoes(entity.getRecomendacoes());
        domain.setOrigem(entity.getOrigem());
        domain.setCreatedAt(entity.getCreatedAt());
        return domain;
    }
}
