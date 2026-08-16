package br.com.group18.energiai.infrastructure.adapters.out.persistence.adapter;

import br.com.group18.energiai.core.domain.model.ApplianceSnapshot;
import br.com.group18.energiai.core.domain.model.EnergyAnalysis;
import br.com.group18.energiai.core.ports.out.AnalysisRepositoryPort;
import br.com.group18.energiai.infrastructure.adapters.out.persistence.entity.AnalysisApplianceSnapshotEntity;
import br.com.group18.energiai.infrastructure.adapters.out.persistence.entity.AnalysisRecommendationEntity;
import br.com.group18.energiai.infrastructure.adapters.out.persistence.entity.EnergyAnalysisEntity;
import br.com.group18.energiai.infrastructure.adapters.out.persistence.mapper.EnergyAnalysisMapper;
import br.com.group18.energiai.infrastructure.adapters.out.persistence.repository.AnalysisApplianceSnapshotJpaRepository;
import br.com.group18.energiai.infrastructure.adapters.out.persistence.repository.AnalysisRecommendationJpaRepository;
import br.com.group18.energiai.infrastructure.adapters.out.persistence.repository.EnergyAnalysisJpaRepository;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class EnergyAnalysisRepositoryAdapter implements AnalysisRepositoryPort {

    private final EnergyAnalysisJpaRepository analysisRepository;
    private final AnalysisRecommendationJpaRepository recommendationRepository;
    private final AnalysisApplianceSnapshotJpaRepository snapshotRepository;
    private final EnergyAnalysisMapper mapper;

    public EnergyAnalysisRepositoryAdapter(
            EnergyAnalysisJpaRepository analysisRepository,
            EnergyAnalysisMapper mapper,
            AnalysisRecommendationJpaRepository recommendationRepository,
            AnalysisApplianceSnapshotJpaRepository snapshotRepository) {

        this.analysisRepository = analysisRepository;
        this.mapper = mapper;
        this.recommendationRepository = recommendationRepository;
        this.snapshotRepository = snapshotRepository;
    }

    @Override
    @Transactional
    public EnergyAnalysis save(EnergyAnalysis analysis) {
        EnergyAnalysisEntity savedEntity = analysisRepository.save(mapper.toEntity(analysis));

        recommendationRepository.deleteByAnalysisId(savedEntity.getId());
        List<AnalysisRecommendationEntity> recommendations = analysis.getRecommendations().stream()
                .map(description -> new AnalysisRecommendationEntity(savedEntity.getId(), description))
                .toList();
        if (!recommendations.isEmpty()) {
            recommendationRepository.saveAll(recommendations);
        }

        snapshotRepository.deleteByAnalysisId(savedEntity.getId());
        if (analysis.getAppliancesSnapshot() != null
                && !analysis.getAppliancesSnapshot().isEmpty()) {
            List<AnalysisApplianceSnapshotEntity> snapshots = analysis.getAppliancesSnapshot().stream()
                    .map(snap -> new AnalysisApplianceSnapshotEntity(
                            savedEntity.getId(),
                            snap.getApplianceName(),
                            snap.getApplianceCategory(),
                            snap.getQuantity(),
                            snap.getAveragePowerWatts(),
                            snap.getAverageDailyUseHours(),
                            snap.getMonthlyConsumptionKwh()))
                    .toList();
            snapshotRepository.saveAll(snapshots);
        }

        EnergyAnalysis result = mapper.toDomain(savedEntity);
        result.setRecommendations(analysis.getRecommendations());
        result.setAppliancesSnapshot(analysis.getAppliancesSnapshot());
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

            List<ApplianceSnapshot> snapshots = snapshotRepository.findByAnalysisIdIn(List.of(id)).stream()
                    .map(snapEntity -> new ApplianceSnapshot(
                            snapEntity.getApplianceName(),
                            snapEntity.getApplianceCategory(),
                            snapEntity.getQuantity(),
                            snapEntity.getAveragePowerWatts(),
                            snapEntity.getAverageDailyUseHours(),
                            snapEntity.getMonthlyConsumptionKwh()))
                    .toList();
            analysis.setAppliancesSnapshot(snapshots);

            return analysis;
        });
    }

    @Override
    public List<EnergyAnalysis> listByPropertyIds(List<Long> propertyIds) {
        if (propertyIds.isEmpty()) {
            return List.of();
        }
        return mapWithDetails(analysisRepository.findByPropertyIdInOrderByCreatedAtDesc(propertyIds));
    }

    @Override
    @Transactional
    public void deleteById(Long id) {
        recommendationRepository.deleteByAnalysisId(id);
        snapshotRepository.deleteByAnalysisId(id);
        analysisRepository.deleteById(id);
    }

    private List<EnergyAnalysis> mapWithDetails(List<EnergyAnalysisEntity> entities) {
        if (entities.isEmpty()) {
            return List.of();
        }

        List<Long> analysisIds =
                entities.stream().map(EnergyAnalysisEntity::getId).toList();

        Map<Long, List<String>> recommendationsByAnalysis =
                recommendationRepository.findByAnalysisIdIn(analysisIds).stream()
                        .collect(Collectors.groupingBy(
                                AnalysisRecommendationEntity::getAnalysisId,
                                Collectors.mapping(AnalysisRecommendationEntity::getDescription, Collectors.toList())));

        Map<Long, List<ApplianceSnapshot>> snapshotsByAnalysis =
                snapshotRepository.findByAnalysisIdIn(analysisIds).stream()
                        .collect(Collectors.groupingBy(
                                AnalysisApplianceSnapshotEntity::getAnalysisId,
                                Collectors.mapping(
                                        snapEntity -> new ApplianceSnapshot(
                                                snapEntity.getApplianceName(),
                                                snapEntity.getApplianceCategory(),
                                                snapEntity.getQuantity(),
                                                snapEntity.getAveragePowerWatts(),
                                                snapEntity.getAverageDailyUseHours(),
                                                snapEntity.getMonthlyConsumptionKwh()),
                                        Collectors.toList())));

        return entities.stream()
                .map(entity -> {
                    EnergyAnalysis analysis = mapper.toDomain(entity);
                    analysis.setRecommendations(recommendationsByAnalysis.getOrDefault(entity.getId(), List.of()));
                    analysis.setAppliancesSnapshot(snapshotsByAnalysis.getOrDefault(entity.getId(), List.of()));
                    return analysis;
                })
                .toList();
    }
}
