package br.com.group18.energiai.infrastructure.adapters.in.web.controllers;

import br.com.group18.energiai.infrastructure.client.MlSchemaRegistry;
import br.com.group18.energiai.infrastructure.client.dto.MlApplianceDTO;
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

    private final MlSchemaRegistry registry;

    public ApplianceController(MlSchemaRegistry registry) {
        this.registry = registry;
    }

    @Operation(
            summary = "Listar catálogo de eletrodomésticos",
            description = "Retorna o catálogo completo de eletrodomésticos descobertos dinamicamente no ML Service.")
    @ApiResponse(responseCode = "200", description = "Catálogo de eletrodomésticos retornado")
    @GetMapping
    public ResponseEntity<List<MlApplianceDTO>> list() {
        return ResponseEntity.ok(registry.getApplianceCatalog());
    }
}
