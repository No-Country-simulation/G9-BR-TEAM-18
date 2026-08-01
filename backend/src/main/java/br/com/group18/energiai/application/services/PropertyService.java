package br.com.group18.energiai.application.services;

import br.com.group18.energiai.application.exception.ForbiddenOperationException;
import br.com.group18.energiai.application.exception.ResourceNotFoundException;
import br.com.group18.energiai.core.domain.model.Appliance;
import br.com.group18.energiai.core.domain.model.Property;
import br.com.group18.energiai.core.domain.model.PropertyAppliance;
import br.com.group18.energiai.core.ports.out.ApplianceRepositoryPort;
import br.com.group18.energiai.core.ports.out.PropertyApplianceRepositoryPort;
import br.com.group18.energiai.core.ports.out.PropertyRepositoryPort;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PropertyService {

    private final PropertyRepositoryPort propertyRepository;
    private final ApplianceRepositoryPort applianceRepository;
    private final PropertyApplianceRepositoryPort propertyApplianceRepository;

    public PropertyService(
            PropertyRepositoryPort propertyRepository,
            ApplianceRepositoryPort applianceRepository,
            PropertyApplianceRepositoryPort propertyApplianceRepository) {
        this.propertyRepository = propertyRepository;
        this.applianceRepository = applianceRepository;
        this.propertyApplianceRepository = propertyApplianceRepository;
    }

    public Property create(
            Long userId, String alias, String propertyType, String address, Integer residentCount, Double areaSqm) {
        Property property = new Property(userId, alias, propertyType);
        property.setAddress(address);
        property.setResidentCount(residentCount);
        property.setAreaSqm(areaSqm);
        return propertyRepository.save(property);
    }

    public List<Property> listByUserId(Long userId) {
        return propertyRepository.findByUserId(userId);
    }

    public Property getOwned(Long propertyId, Long userId) {
        Property property = propertyRepository
                .findById(propertyId)
                .orElseThrow(() -> new ResourceNotFoundException("Propriedade não encontrada."));
        if (!property.getUserId().equals(userId)) {
            throw new ForbiddenOperationException("Você não tem acesso a esta propriedade.");
        }
        return property;
    }

    public Property update(
            Long propertyId,
            Long userId,
            String alias,
            String propertyType,
            boolean active,
            String address,
            Integer residentCount,
            Double areaSqm) {
        Property property = getOwned(propertyId, userId);
        property.setAlias(alias);
        property.setPropertyType(propertyType);
        property.setActive(active);
        property.setAddress(address);
        property.setResidentCount(residentCount);
        property.setAreaSqm(areaSqm);
        return propertyRepository.save(property);
    }

    public void delete(Long propertyId, Long userId) {
        propertyRepository.delete(getOwned(propertyId, userId));
    }

    public List<PropertyAppliance> listAppliances(Long propertyId, Long userId) {
        getOwned(propertyId, userId);
        return propertyApplianceRepository.findByPropertyId(propertyId);
    }

    public PropertyAppliance addOrUpdateAppliance(Long propertyId, Long userId, Long applianceId, Integer quantity) {
        getOwned(propertyId, userId);
        Appliance appliance = applianceRepository
                .findById(applianceId)
                .orElseThrow(() -> new ResourceNotFoundException("Aparelho não encontrado."));

        PropertyAppliance propertyAppliance = propertyApplianceRepository
                .findByPropertyIdAndApplianceId(propertyId, applianceId)
                .orElseGet(() -> new PropertyAppliance(propertyId, appliance, quantity));
        propertyAppliance.setQuantity(quantity);
        return propertyApplianceRepository.save(propertyAppliance);
    }

    public void removeAppliance(Long propertyId, Long userId, Long applianceId) {
        getOwned(propertyId, userId);
        PropertyAppliance propertyAppliance = propertyApplianceRepository
                .findByPropertyIdAndApplianceId(propertyId, applianceId)
                .orElseThrow(() -> new ResourceNotFoundException("Aparelho não está vinculado à propriedade."));
        propertyApplianceRepository.delete(propertyAppliance);
    }

    @Transactional
    public List<PropertyAppliance> batchUpdateAppliances(Long propertyId, Long userId, List<ApplianceQuantity> items) {
        getOwned(propertyId, userId);

        List<Long> incomingIds =
                items.stream().map(ApplianceQuantity::applianceId).toList();

        List<PropertyAppliance> existing = propertyApplianceRepository.findByPropertyId(propertyId);

        for (PropertyAppliance pa : existing) {
            if (!incomingIds.contains(pa.getAppliance().getId())) {
                propertyApplianceRepository.delete(pa);
            }
        }

        List<PropertyAppliance> result = new ArrayList<>();
        for (ApplianceQuantity item : items) {
            Appliance appliance = applianceRepository
                    .findById(item.applianceId())
                    .orElseThrow(() ->
                            new ResourceNotFoundException("Aparelho id=" + item.applianceId() + " não encontrado."));

            PropertyAppliance pa = propertyApplianceRepository
                    .findByPropertyIdAndApplianceId(propertyId, item.applianceId())
                    .orElseGet(() -> new PropertyAppliance(propertyId, appliance, item.quantity()));
            pa.setQuantity(item.quantity());
            result.add(propertyApplianceRepository.save(pa));
        }

        return result;
    }

    public record ApplianceQuantity(@JsonProperty("appliance_id") Long applianceId, Integer quantity) {}
}
