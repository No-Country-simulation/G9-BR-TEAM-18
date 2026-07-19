package br.com.group18.energiai.infrastructure.adapters.out.persistence.repository;

import br.com.group18.energiai.infrastructure.adapters.out.persistence.entity.AnalysisRecommendationEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AnalysisRecommendationJpaRepository extends JpaRepository<AnalysisRecommendationEntity, Long> {

    List<AnalysisRecommendationEntity> findByAnalysisIdIn(List<Long> analysisIds);

    void deleteByAnalysisId(Long analysisId);
}
