package br.com.group18.energiai.infrastructure.adapters.out.persistence.repository;

import br.com.group18.energiai.infrastructure.adapters.out.persistence.entity.PropertyEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PropertyJpaRepository extends JpaRepository<PropertyEntity, Long> {

    List<PropertyEntity> findByUserIdOrderByAliasAsc(Long userId);
}
