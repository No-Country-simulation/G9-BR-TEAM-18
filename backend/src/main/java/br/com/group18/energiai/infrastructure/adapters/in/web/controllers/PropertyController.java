package br.com.group18.energiai.infrastructure.adapters.in.web.controllers;

import br.com.group18.energiai.application.services.PropertyService;
import br.com.group18.energiai.application.services.PropertyService.ApplianceQuantity;
import br.com.group18.energiai.core.domain.model.Property;
import br.com.group18.energiai.core.domain.model.PropertyAppliance;
import br.com.group18.energiai.infrastructure.adapters.in.web.dto.PropertyApplianceRequestDTO;
import br.com.group18.energiai.infrastructure.adapters.in.web.dto.PropertyApplianceResponseDTO;
import br.com.group18.energiai.infrastructure.adapters.in.web.dto.PropertyRequestDTO;
import br.com.group18.energiai.infrastructure.adapters.in.web.dto.PropertyResponseDTO;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/properties")
public class PropertyController {

    private final PropertyService propertyService;

    public PropertyController(PropertyService propertyService) {
        this.propertyService = propertyService;
    }

    @PostMapping
    public ResponseEntity<PropertyResponseDTO> create(
            @Valid @RequestBody PropertyRequestDTO request, HttpServletRequest httpRequest) {
        Long userId = authenticatedUser(httpRequest);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        Property property = propertyService.create(
                userId, request.getAlias(), request.getPropertyType().name(),
                request.getAddress(), request.getResidentCount(), request.getAreaSqm());
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(property));
    }

    @GetMapping
    public ResponseEntity<List<PropertyResponseDTO>> list(HttpServletRequest httpRequest) {
        Long userId = authenticatedUser(httpRequest);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(propertyService.listByUserId(userId).stream()
                .map(this::toResponse)
                .toList());
    }

    @PutMapping("/{propertyId}")
    public ResponseEntity<PropertyResponseDTO> update(
            @PathVariable Long propertyId,
            @Valid @RequestBody PropertyRequestDTO request,
            HttpServletRequest httpRequest) {
        Long userId = authenticatedUser(httpRequest);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(toResponse(propertyService.update(
                propertyId,
                userId,
                request.getAlias(),
                request.getPropertyType().name(),
                request.isActive(),
                request.getAddress(),
                request.getResidentCount(),
                request.getAreaSqm())));
    }

    @DeleteMapping("/{propertyId}")
    public ResponseEntity<Void> delete(@PathVariable Long propertyId, HttpServletRequest httpRequest) {
        Long userId = authenticatedUser(httpRequest);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        propertyService.delete(propertyId, userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{propertyId}/appliances")
    public ResponseEntity<List<PropertyApplianceResponseDTO>> listAppliances(
            @PathVariable Long propertyId, HttpServletRequest httpRequest) {
        Long userId = authenticatedUser(httpRequest);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(propertyService.listAppliances(propertyId, userId).stream()
                .map(this::toResponse)
                .toList());
    }

    @PostMapping("/{propertyId}/appliances")
    public ResponseEntity<PropertyApplianceResponseDTO> addAppliance(
            @PathVariable Long propertyId,
            @Valid @RequestBody PropertyApplianceRequestDTO request,
            HttpServletRequest httpRequest) {
        Long userId = authenticatedUser(httpRequest);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        PropertyAppliance propertyAppliance = propertyService.addOrUpdateAppliance(
                propertyId, userId, request.getApplianceId(), request.getQuantity());
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(propertyAppliance));
    }

    @PutMapping("/{propertyId}/appliances/{applianceId}")
    public ResponseEntity<PropertyApplianceResponseDTO> updateAppliance(
            @PathVariable Long propertyId,
            @PathVariable Long applianceId,
            @Valid @RequestBody PropertyApplianceRequestDTO request,
            HttpServletRequest httpRequest) {
        if (!applianceId.equals(request.getApplianceId())) {
            return ResponseEntity.badRequest().build();
        }
        Long userId = authenticatedUser(httpRequest);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(toResponse(
                propertyService.addOrUpdateAppliance(propertyId, userId, applianceId, request.getQuantity())));
    }

    @PutMapping("/{propertyId}/appliances/batch")
    public ResponseEntity<List<PropertyApplianceResponseDTO>> batchUpdateAppliances(
            @PathVariable Long propertyId,
            @RequestBody List<ApplianceQuantity> items,
            HttpServletRequest httpRequest) {
        Long userId = authenticatedUser(httpRequest);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(propertyService.batchUpdateAppliances(propertyId, userId, items).stream()
                .map(this::toResponse)
                .toList());
    }

    @DeleteMapping("/{propertyId}/appliances/{applianceId}")
    public ResponseEntity<Void> removeAppliance(
            @PathVariable Long propertyId, @PathVariable Long applianceId, HttpServletRequest httpRequest) {
        Long userId = authenticatedUser(httpRequest);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        propertyService.removeAppliance(propertyId, userId, applianceId);
        return ResponseEntity.noContent().build();
    }

    private Long authenticatedUser(HttpServletRequest request) {
        return AuthController.getUserId(request);
    }

    private PropertyResponseDTO toResponse(Property property) {
        return new PropertyResponseDTO(
                property.getId(), property.getAlias(), property.getPropertyType(), property.isActive(),
                property.getAddress(), property.getResidentCount(), property.getAreaSqm());
    }

    private PropertyApplianceResponseDTO toResponse(PropertyAppliance propertyAppliance) {
        return new PropertyApplianceResponseDTO(
                propertyAppliance.getId(),
                propertyAppliance.getAppliance().getId(),
                propertyAppliance.getAppliance().getName(),
                propertyAppliance.getAppliance().getApplianceCategory(),
                propertyAppliance.getQuantity(),
                propertyAppliance.getAppliance().getAveragePowerWatts(),
                propertyAppliance.getAppliance().getAverageDailyUseHours(),
                propertyAppliance.getMonthlyConsumptionKwh());
    }
}
