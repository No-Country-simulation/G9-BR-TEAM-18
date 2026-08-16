package br.com.group18.energiai.infrastructure.adapters.in.web.controllers;

import br.com.group18.energiai.core.domain.model.EquipmentCategory;
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
            summary = "Listar catálogo de aparelhos",
            description = "Retorna o catálogo oficial de aparelhos mapeado e sincronizado com o ML Service.")
    @ApiResponse(responseCode = "200", description = "Lista de aparelhos retornada com sucesso")
    @GetMapping
    public ResponseEntity<List<ApplianceResponseDTO>> list() {

        List<ApplianceResponseDTO> response = applianceRepository.findAll().stream()
                .map(appliance -> new ApplianceResponseDTO(
                        appliance.getId(),
                        appliance.getName(),
                        EquipmentCategory.toEnglishFromPortuguese(appliance.getApplianceCategory()),
                        appliance.getAveragePowerWatts() != null
                                ? appliance.getAveragePowerWatts().intValue()
                                : 0,
                        appliance.getAverageDailyUseHours() != null
                                ? appliance.getAverageDailyUseHours().doubleValue()
                                : 0.0))
                .toList();

        return ResponseEntity.ok(response);
    }
}
