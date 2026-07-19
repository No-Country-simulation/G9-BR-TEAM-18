package br.com.group18.energiai.infrastructure.adapters.out.persistence.adapter;

import br.com.group18.energiai.core.domain.model.EnergyAnalysis;
import br.com.group18.energiai.core.ports.out.AnalysisRepositoryPort;
import br.com.group18.energiai.infrastructure.adapters.out.persistence.entity.AnalysisRecommendationEntity;
import br.com.group18.energiai.infrastructure.adapters.out.persistence.entity.EnergyAnalysisEntity;
import br.com.group18.energiai.infrastructure.adapters.out.persistence.mapper.EnergyAnalysisMapper;
import br.com.group18.energiai.infrastructure.adapters.out.persistence.repository.AnalysisRecommendationJpaRepository;
import br.com.group18.energiai.infrastructure.adapters.out.persistence.repository.EnergyAnalysisJpaRepository;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class EnergyAnalysisRepositoryAdapter implements AnalysisRepositoryPort {

    private final EnergyAnalysisJpaRepository analysisRepository;
    private final AnalysisRecommendationJpaRepository recommendationRepository;
    private final EnergyAnalysisMapper mapper;

    public EnergyAnalysisRepositoryAdapter(
            EnergyAnalysisJpaRepository analysisRepository,
            AnalysisRecommendationJpaRepository recommendationRepository,
            EnergyAnalysisMapper mapper) {
        this.analysisRepository = analysisRepository;
        this.recommendationRepository = recommendationRepository;
        this.mapper = mapper;
    }

    @Override
    @Transactional
    public EnergyAnalysis save(EnergyAnalysis analysis) {
        EnergyAnalysisEntity saved = analysisRepository.save(mapper.toEntity(analysis));
        recommendationRepository.deleteByAnalysisId(saved.getId());
        List<AnalysisRecommendationEntity> recommendations = analysis.getRecommendations().stream()
                .map(description -> new AnalysisRecommendationEntity(saved.getId(), description))
                .toList();
        if (!recommendations.isEmpty()) {
            recommendationRepository.saveAll(recommendations);
        }
        EnergyAnalysis result = mapper.toDomain(saved);
        result.setRecommendations(analysis.getRecommendations());
        return result;
    }

    @Override
    public Optional<EnergyAnalysis> findById(Long id) {
        return analysisRepository.findById(id).map(entity -> {
            EnergyAnalysis analysis = mapper.toDomain(entity);
            List<String> recommendations = recommendationRepository.findByAnalysisIdIn(List.of(id)).stream()
                    .map(AnalysisRecommendationEntity::getDescription)
                    .toList();
            analysis.setRecommendations(recommendations);
            return analysis;
        });
    }

    @Override
    public List<EnergyAnalysis> listByPropertyId(Long propertyId) {
        return mapWithRecommendations(analysisRepository.findByPropertyIdOrderByCreatedAtDesc(propertyId));
    }

    @Override
    public List<EnergyAnalysis> listByPropertyIds(List<Long> propertyIds) {
        if (propertyIds.isEmpty()) {
            return List.of();
        }
        return mapWithRecommendations(analysisRepository.findByPropertyIdInOrderByCreatedAtDesc(propertyIds));
    }

    private List<EnergyAnalysis> mapWithRecommendations(List<EnergyAnalysisEntity> entities) {
        if (entities.isEmpty()) {
            return List.of();
        }
        Map<Long, List<String>> recommendationsByAnalysis = recommendationRepository
                .findByAnalysisIdIn(entities.stream().map(EnergyAnalysisEntity::getId).toList())
                .stream()
                .collect(Collectors.groupingBy(
                        AnalysisRecommendationEntity::getAnalysisId,
                        Collectors.mapping(AnalysisRecommendationEntity::getDescription, Collectors.toList())));

        return entities.stream()
                .map(entity -> {
                    EnergyAnalysis analysis = mapper.toDomain(entity);
                    analysis.setRecommendations(recommendationsByAnalysis.getOrDefault(entity.getId(), List.of()));
                    return analysis;
                })
                .toList();
    }
}
