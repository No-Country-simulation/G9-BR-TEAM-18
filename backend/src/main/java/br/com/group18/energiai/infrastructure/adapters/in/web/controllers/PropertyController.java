package br.com.group18.energiai.infrastructure.adapters.in.web.controllers;

import br.com.group18.energiai.application.services.PropertyService;
import br.com.group18.energiai.application.services.PropertyService.ApplianceQuantity;
import br.com.group18.energiai.core.domain.model.Property;
import br.com.group18.energiai.core.domain.model.PropertyAppliance;
import br.com.group18.energiai.infrastructure.adapters.in.web.dto.PropertyApplianceRequestDTO;
import br.com.group18.energiai.infrastructure.adapters.in.web.dto.PropertyApplianceResponseDTO;
import br.com.group18.energiai.infrastructure.adapters.in.web.dto.PropertyRequestDTO;
import br.com.group18.energiai.infrastructure.adapters.in.web.dto.PropertyResponseDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
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

@Tag(name = "Propriedades")
@SecurityRequirement(name = "sessionCookie")
@RestController
@RequestMapping("/properties")
public class PropertyController {

    private final PropertyService propertyService;

    public PropertyController(PropertyService propertyService) {
        this.propertyService = propertyService;
    }

    @Operation(
            summary = "Criar propriedade",
            description = "Registra uma nova propriedade (residencial ou comercial) para o usuário autenticado.")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Propriedade criada com sucesso"),
        @ApiResponse(responseCode = "400", description = "Dados inválidos na requisição")
    })
    @PostMapping
    public ResponseEntity<PropertyResponseDTO> create(
            @Valid @RequestBody PropertyRequestDTO request, HttpServletRequest httpRequest) {
        Long userId = authenticatedUser(httpRequest);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        Property property = propertyService.create(
                userId,
                request.getAlias(),
                request.getPropertyType().name(),
                request.getAddress(),
                request.getResidentCount(),
                request.getAreaSqm());
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(property));
    }

    @Operation(summary = "Listar propriedades", description = "Retorna todas as propriedades do usuário autenticado.")
    @ApiResponse(responseCode = "200", description = "Lista de propriedades retornada")
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

    @Operation(
            summary = "Atualizar propriedade",
            description = "Atualiza os dados de uma propriedade existente. Apenas o proprietário pode alterar.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Propriedade atualizada com sucesso"),
        @ApiResponse(responseCode = "404", description = "Propriedade não encontrada")
    })
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

    @Operation(
            summary = "Excluir propriedade",
            description =
                    "Remove uma propriedade e todos os seus eletrodomésticos associados. Apenas o proprietário pode excluir.")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Propriedade excluída com sucesso (sem conteúdo)"),
        @ApiResponse(responseCode = "404", description = "Propriedade não encontrada")
    })
    @DeleteMapping("/{propertyId}")
    public ResponseEntity<Void> delete(@PathVariable Long propertyId, HttpServletRequest httpRequest) {
        Long userId = authenticatedUser(httpRequest);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        propertyService.delete(propertyId, userId);
        return ResponseEntity.noContent().build();
    }

    @Operation(
            summary = "Listar eletrodomésticos da propriedade",
            description = "Retorna todos os eletrodomésticos cadastrados em uma propriedade específica.")
    @ApiResponse(responseCode = "200", description = "Lista de eletrodomésticos retornada")
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

    @Operation(
            summary = "Adicionar eletrodoméstico à propriedade",
            description =
                    "Adiciona um eletrodoméstico do catálogo a uma propriedade. Se já existir, atualiza a quantidade.")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Eletrodoméstico adicionado com sucesso"),
        @ApiResponse(responseCode = "400", description = "Dados inválidos na requisição")
    })
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

    @Operation(
            summary = "Atualizar quantidade de eletrodoméstico",
            description = "Atualiza a quantidade de um eletrodoméstico específico em uma propriedade.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Quantidade atualizada com sucesso"),
        @ApiResponse(responseCode = "400", description = "ID do eletrodoméstico na URL difere do corpo")
    })
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

    @Operation(
            summary = "Atualizar lote de eletrodomésticos",
            description =
                    "Atualiza múltiplos eletrodomésticos de uma vez em uma propriedade. Substitui todos os existentes.")
    @ApiResponse(responseCode = "200", description = "Lote atualizado com sucesso")
    @PutMapping("/{propertyId}/appliances/batch")
    public ResponseEntity<List<PropertyApplianceResponseDTO>> batchUpdateAppliances(
            @PathVariable Long propertyId, @RequestBody List<ApplianceQuantity> items, HttpServletRequest httpRequest) {
        Long userId = authenticatedUser(httpRequest);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(propertyService.batchUpdateAppliances(propertyId, userId, items).stream()
                .map(this::toResponse)
                .toList());
    }

    @Operation(
            summary = "Remover eletrodoméstico da propriedade",
            description = "Remove um eletrodoméstico específico de uma propriedade.")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Eletrodoméstico removido com sucesso (sem conteúdo)"),
        @ApiResponse(responseCode = "404", description = "Propriedade ou eletrodoméstico não encontrado")
    })
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
                property.getId(),
                property.getAlias(),
                property.getPropertyType(),
                property.isActive(),
                property.getAddress(),
                property.getResidentCount(),
                property.getAreaSqm());
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
