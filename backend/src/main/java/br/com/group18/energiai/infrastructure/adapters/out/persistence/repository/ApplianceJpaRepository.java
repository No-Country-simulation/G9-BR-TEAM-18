package br.com.group18.energiai.infrastructure.adapters.out.persistence.repository;

import br.com.group18.energiai.infrastructure.adapters.out.persistence.entity.ApplianceEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ApplianceJpaRepository extends JpaRepository<ApplianceEntity, Long> {

    List<ApplianceEntity> findAllByOrderByNameAsc();
}
