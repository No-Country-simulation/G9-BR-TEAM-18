package br.com.group18.energiai.infrastructure.adapters.in.web.controllers;

import br.com.group18.energiai.core.domain.model.Appliance;
import br.com.group18.energiai.core.ports.out.ApplianceRepositoryPort;
import br.com.group18.energiai.infrastructure.adapters.in.web.dto.ApplianceResponseDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Eletrodomésticos")
@RestController
@RequestMapping("/appliances")
public class ApplianceController {

    private final ApplianceRepositoryPort applianceRepository;

    public ApplianceController(ApplianceRepositoryPort applianceRepository) {
        this.applianceRepository = applianceRepository;
    }

    @Operation(
            summary = "Listar catálogo de eletrodomésticos",
            description =
                    "Retorna o catálogo completo de eletrodomésticos disponíveis no sistema, com potência média e uso diário estimado.")
    @ApiResponse(responseCode = "200", description = "Catálogo de eletrodomésticos retornado")
    @GetMapping
    public ResponseEntity<List<ApplianceResponseDTO>> list() {
        return ResponseEntity.ok(
                applianceRepository.findAll().stream().map(this::toResponse).toList());
    }

    private ApplianceResponseDTO toResponse(Appliance appliance) {
        return new ApplianceResponseDTO(
                appliance.getId(),
                appliance.getName(),
                appliance.getApplianceCategory(),
                appliance.getAveragePowerWatts(),
                appliance.getAverageDailyUseHours());
    }
}
