package br.com.group18.energiai.infrastructure.adapters.out.persistence.repository;

import br.com.group18.energiai.infrastructure.adapters.out.persistence.entity.PropertyApplianceEntity;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PropertyApplianceJpaRepository extends JpaRepository<PropertyApplianceEntity, Long> {

    List<PropertyApplianceEntity> findByPropertyIdOrderByIdAsc(Long propertyId);

    Optional<PropertyApplianceEntity> findByPropertyIdAndAppliance_Id(Long propertyId, Long applianceId);
}
