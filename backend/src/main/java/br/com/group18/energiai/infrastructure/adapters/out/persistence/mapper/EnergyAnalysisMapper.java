package br.com.group18.energiai.infrastructure.adapters.out.persistence.mapper;

import br.com.group18.energiai.core.domain.model.EnergyAnalysis;
import br.com.group18.energiai.infrastructure.adapters.out.persistence.entity.EnergyAnalysisEntity;
import org.springframework.stereotype.Component;

@Component
public class EnergyAnalysisMapper {

    public EnergyAnalysisEntity toEntity(EnergyAnalysis domain) {
        if (domain == null) return null;

        EnergyAnalysisEntity entity = new EnergyAnalysisEntity();
        entity.setId(domain.getId());
        entity.setConsumptionKwh(domain.getConsumptionKwh());
        entity.setPeakHourUsage(domain.getPeakHourUsage());
        entity.setEquipmentQuantity(domain.getEquipmentQuantity());
        entity.setPropertyType(domain.getPropertyType());
        entity.setHighConsumptionHours(domain.getHighConsumptionHours());
        entity.setHighestConsumptionCategory(domain.getHighestConsumptionCategory());
        entity.setRefrigerationWatts(domain.getRefrigerationWatts());
        entity.setHeatingWatts(domain.getHeatingWatts());
        entity.setAirConditioningWatts(domain.getAirConditioningWatts());
        entity.setLightingWatts(domain.getLightingWatts());
        entity.setCategory(domain.getCategory());
        entity.setProbability(domain.getProbability());
        entity.setEstimatedMonthlyCost(domain.getEstimatedMonthlyCost());
        entity.setRecommendations(domain.getRecommendations());
        entity.setSource(domain.getSource());
        entity.setCreatedAt(domain.getCreatedAt());
        return entity;
    }

    public EnergyAnalysis toDomain(EnergyAnalysisEntity entity) {
        if (entity == null) return null;

        EnergyAnalysis domain = new EnergyAnalysis(
                entity.getConsumptionKwh(),
                entity.getPeakHourUsage(),
                entity.getEquipmentQuantity(),
                entity.getPropertyType(),
                entity.getHighConsumptionHours());
        domain.setId(entity.getId());
        domain.setHighestConsumptionCategory(entity.getHighestConsumptionCategory());
        domain.setRefrigerationWatts(entity.getRefrigerationWatts());
        domain.setHeatingWatts(entity.getHeatingWatts());
        domain.setAirConditioningWatts(entity.getAirConditioningWatts());
        domain.setLightingWatts(entity.getLightingWatts());
        domain.setCategory(entity.getCategory());
        domain.setProbability(entity.getProbability());
        domain.setEstimatedMonthlyCost(entity.getEstimatedMonthlyCost());
        domain.setRecommendations(entity.getRecommendations());
        domain.setSource(entity.getSource());
        domain.setCreatedAt(entity.getCreatedAt());
        return domain;
    }
}
