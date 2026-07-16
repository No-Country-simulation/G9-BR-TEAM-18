package br.com.group18.energiai.infrastructure.adapters.in.web.controllers;

import br.com.group18.energiai.core.domain.model.AnaliseEnergia;
import br.com.group18.energiai.core.ports.in.GerarAnaliseUseCase;
import br.com.group18.energiai.infrastructure.adapters.in.web.dto.AnaliseRequestDTO;
import br.com.group18.energiai.infrastructure.adapters.in.web.dto.AnaliseResponseDTO;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
public class AnaliseController {

    private final GerarAnaliseUseCase gerarAnaliseUseCase;

    public AnaliseController(GerarAnaliseUseCase gerarAnaliseUseCase) {
        this.gerarAnaliseUseCase = gerarAnaliseUseCase;
    }

    @PostMapping("/analise-energetica")
    public ResponseEntity<AnaliseResponseDTO> analisar(@Valid @RequestBody AnaliseRequestDTO request) {
        AnaliseEnergia resultado = gerarAnaliseUseCase.executar(
                request.getConsumoKwh(),
                request.getUsoHorarioPico(),
                request.getQuantidadeEquipamentos(),
                request.getTipoImovel(),
                request.getHorasAltoConsumo()
        );

        AnaliseResponseDTO response = new AnaliseResponseDTO();
        response.setId(resultado.getId());
        response.setCategoria(resultado.getCategoria());
        response.setProbabilidade(resultado.getProbabilidade());
        response.setRecomendacoes(resultado.getRecomendacoes());
        response.setCustoEstimadoMensal(resultado.getCustoEstimadoMensal());
        response.setOrigem(resultado.getOrigem());
        response.setCreatedAt(resultado.getCreatedAt());

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/analises")
    public ResponseEntity<?> listar() {
        return ResponseEntity.ok().build();
    }
}
