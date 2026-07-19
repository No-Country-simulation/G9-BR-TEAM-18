package br.com.group18.energiai.application.services;

import br.com.group18.energiai.application.exception.ForbiddenOperationException;
import br.com.group18.energiai.application.exception.ResourceNotFoundException;
import br.com.group18.energiai.core.domain.model.Appliance;
import br.com.group18.energiai.core.domain.model.Property;
import br.com.group18.energiai.core.domain.model.PropertyAppliance;
import br.com.group18.energiai.core.ports.out.ApplianceRepositoryPort;
import br.com.group18.energiai.core.ports.out.PropertyApplianceRepositoryPort;
import br.com.group18.energiai.core.ports.out.PropertyRepositoryPort;
import java.util.List;
import org.springframework.stereotype.Service;

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

    public Property create(Long userId, String alias, String propertyType) {
        return propertyRepository.save(new Property(userId, alias, propertyType));
    }

    public List<Property> listByUserId(Long userId) {
        return propertyRepository.findByUserId(userId);
    }

    public Property getOwned(Long propertyId, Long userId) {
        Property property = propertyRepository
                .findById(propertyId)
                .orElseThrow(() -> new ResourceNotFoundException("Propriedade n\u00e3o encontrada."));
        if (!property.getUserId().equals(userId)) {
            throw new ForbiddenOperationException("Voc\u00ea n\u00e3o tem acesso a esta propriedade.");
        }
        return property;
    }

    public Property update(Long propertyId, Long userId, String alias, String propertyType, boolean active) {
        Property property = getOwned(propertyId, userId);
        property.setAlias(alias);
        property.setPropertyType(propertyType);
        property.setActive(active);
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
                .orElseThrow(() -> new ResourceNotFoundException("Aparelho n\u00e3o encontrado."));

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
                .orElseThrow(() -> new ResourceNotFoundException("Aparelho n\u00e3o est\u00e1 vinculado \u00e0 propriedade."));
        propertyApplianceRepository.delete(propertyAppliance);
    }
}
