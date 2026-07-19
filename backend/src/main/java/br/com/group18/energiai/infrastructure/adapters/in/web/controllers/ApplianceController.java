package br.com.group18.energiai.infrastructure.adapters.in.web.controllers;

import br.com.group18.energiai.core.domain.model.Appliance;
import br.com.group18.energiai.core.ports.out.ApplianceRepositoryPort;
import br.com.group18.energiai.infrastructure.adapters.in.web.dto.ApplianceResponseDTO;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/appliances")
public class ApplianceController {

    private final ApplianceRepositoryPort applianceRepository;

    public ApplianceController(ApplianceRepositoryPort applianceRepository) {
        this.applianceRepository = applianceRepository;
    }

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
