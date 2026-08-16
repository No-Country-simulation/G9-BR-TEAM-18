package br.com.group18.energiai.infrastructure.adapters.out.persistence.repository;

import br.com.group18.energiai.infrastructure.adapters.out.persistence.entity.AnalysisApplianceSnapshotEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AnalysisApplianceSnapshotJpaRepository extends JpaRepository<AnalysisApplianceSnapshotEntity, Long> {

    List<AnalysisApplianceSnapshotEntity> findByAnalysisIdIn(List<Long> analysisIds);

    void deleteByAnalysisId(Long analysisId);
}
