package br.com.group18.energiai.infrastructure.adapters.in.web.controllers;

import br.com.group18.energiai.core.ports.out.MlContractPort;
import br.com.group18.energiai.infrastructure.adapters.in.web.dto.ContractInfoResponseDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Contrato ML")
@RestController
@RequestMapping("/contract-info")
public class ContractInfoController {

    private final MlContractPort mlContract;

    public ContractInfoController(MlContractPort mlContract) {
        this.mlContract = mlContract;
    }

    @Operation(
            summary = "Listar informações de contrato do ML",
            description =
                    "Retorna as opções válidas suportadas pelo modelo para tipos de propriedade, categorias de consumo e eficiência.")
    @GetMapping
    public ResponseEntity<ContractInfoResponseDTO> getContractInfo() {
        ContractInfoResponseDTO response = new ContractInfoResponseDTO(
                mlContract.propertyTypes(), mlContract.consumptionCategories(), mlContract.efficiencyCategories());
        return ResponseEntity.ok(response);
    }
}
