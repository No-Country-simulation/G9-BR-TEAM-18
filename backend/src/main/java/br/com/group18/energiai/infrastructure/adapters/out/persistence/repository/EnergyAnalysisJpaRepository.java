package br.com.group18.energiai.infrastructure.adapters.out.persistence.repository;

import br.com.group18.energiai.infrastructure.adapters.out.persistence.entity.EnergyAnalysisEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EnergyAnalysisJpaRepository extends JpaRepository<EnergyAnalysisEntity, Long> {}
