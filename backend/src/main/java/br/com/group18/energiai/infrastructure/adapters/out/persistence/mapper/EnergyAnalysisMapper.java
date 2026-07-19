package br.com.group18.energiai.infrastructure.adapters.out.persistence.mapper;

import br.com.group18.energiai.core.domain.model.EnergyAnalysis;
import br.com.group18.energiai.infrastructure.adapters.out.persistence.entity.EnergyAnalysisEntity;
import org.springframework.stereotype.Component;

@Component
public class EnergyAnalysisMapper {

    public EnergyAnalysisEntity toEntity(EnergyAnalysis domain) {
        if (domain == null) {
            return null;
        }

        EnergyAnalysisEntity entity = new EnergyAnalysisEntity();
        entity.setId(domain.getId());
        entity.setPropertyId(domain.getPropertyId());
        entity.setConsumptionKwh(domain.getConsumptionKwh());
        entity.setPeakHourUsage(Boolean.TRUE.equals(domain.getPeakHourUsage()) ? 1 : 0);
        entity.setHighConsumptionHours(domain.getHighConsumptionHours());
        entity.setCategory(domain.getCategory());
        entity.setProbability(domain.getProbability());
        entity.setEstimatedMonthlyCost(domain.getEstimatedMonthlyCost());
        entity.setStatus(domain.getStatus());
        entity.setCreatedAt(domain.getCreatedAt());
        entity.setUpdatedAt(domain.getUpdatedAt());
        return entity;
    }

    public EnergyAnalysis toDomain(EnergyAnalysisEntity entity) {
        if (entity == null) {
            return null;
        }

        EnergyAnalysis domain = new EnergyAnalysis(
                entity.getPropertyId(),
                entity.getConsumptionKwh(),
                Integer.valueOf(1).equals(entity.getPeakHourUsage()),
                entity.getHighConsumptionHours());
        domain.setId(entity.getId());
        domain.setCategory(entity.getCategory());
        domain.setProbability(entity.getProbability());
        domain.setEstimatedMonthlyCost(entity.getEstimatedMonthlyCost());
        domain.setStatus(entity.getStatus());
        domain.setCreatedAt(entity.getCreatedAt());
        domain.setUpdatedAt(entity.getUpdatedAt());
        return domain;
    }
}
