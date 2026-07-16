package br.com.group18.energiai.infrastructure.adapters.in.web.controllers;

import java.util.List;
import java.util.TreeMap;
import java.util.Locale;
import java.time.format.TextStyle;
import java.time.YearMonth;
import java.util.stream.Collectors;

import br.com.group18.energiai.core.domain.model.AnaliseEnergia;
import br.com.group18.energiai.core.ports.in.GerarAnaliseUseCase;
import br.com.group18.energiai.core.ports.out.AnaliseRepositoryPort;
import br.com.group18.energiai.infrastructure.adapters.in.web.dto.AnaliseRequestDTO;
import br.com.group18.energiai.infrastructure.adapters.in.web.dto.AnaliseResponseDTO;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
public class AnaliseController {

    private final GerarAnaliseUseCase gerarAnaliseUseCase;
    private final AnaliseRepositoryPort analiseRepository;

    public AnaliseController(GerarAnaliseUseCase gerarAnaliseUseCase,
                             AnaliseRepositoryPort analiseRepository) {
        this.gerarAnaliseUseCase = gerarAnaliseUseCase;
        this.analiseRepository = analiseRepository;
    }

    private AnaliseResponseDTO toResponse(AnaliseEnergia r) {
        AnaliseResponseDTO dto = new AnaliseResponseDTO();
        dto.setId(r.getId());
        dto.setCategoria(r.getCategoria());
        dto.setProbabilidade(r.getProbabilidade());
        dto.setRecomendacoes(r.getRecomendacoes());
        dto.setCustoEstimadoMensal(r.getCustoEstimadoMensal());
        dto.setOrigem(r.getOrigem());
        dto.setCreatedAt(r.getCreatedAt());
        dto.setCategoriaMaiorConsumo(r.getCategoriaMaiorConsumo());
        dto.setRefrigWatts(r.getRefrigWatts());
        dto.setAquecimentoWatts(r.getAquecimentoWatts());
        dto.setClimatizacaoWatts(r.getClimatizacaoWatts());
        dto.setIluminacaoWatts(r.getIluminacaoWatts());
        return dto;
    }

    @PostMapping("/analise-energetica")
    public ResponseEntity<AnaliseResponseDTO> analisar(@Valid @RequestBody AnaliseRequestDTO request) {
        Double refrig = request.getRefrigWatts();
        Double aquecimento = request.getAquecimentoWatts();
        Double climatizacao = request.getClimatizacaoWatts();
        Double iluminacao = request.getIluminacaoWatts();

        if (request.getDistribuicaoConsumoDiario() != null) {
            var dist = request.getDistribuicaoConsumoDiario();
            if (dist.getRefrigWatts() != null) refrig = dist.getRefrigWatts();
            if (dist.getAquecimentoWatts() != null) aquecimento = dist.getAquecimentoWatts();
            if (dist.getClimatizacaoWatts() != null) climatizacao = dist.getClimatizacaoWatts();
            if (dist.getIluminacaoWatts() != null) iluminacao = dist.getIluminacaoWatts();
        }

        AnaliseEnergia resultado = gerarAnaliseUseCase.executar(
                request.getConsumoKwh(),
                request.getUsoHorarioPico(),
                request.getQuantidadeEquipamentos(),
                request.getTipoImovel(),
                request.getHorasAltoConsumo(),
                request.getCategoriaMaiorConsumo(),
                refrig,
                aquecimento,
                climatizacao,
                iluminacao
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(resultado));
    }

    @GetMapping("/analises")
    public ResponseEntity<List<AnaliseResponseDTO>> listar() {
        List<AnaliseResponseDTO> lista = analiseRepository.listarTodas()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(lista);
    }

    @GetMapping("/dashboard")
    public ResponseEntity<DashboardDTO> dashboard() {
        List<AnaliseEnergia> todas = analiseRepository.listarTodas();
        if (todas.isEmpty()) {
            return ResponseEntity.ok(new DashboardDTO(0, 0.0, 0.0, 0.0, List.of()));
        }

        int totalAnalises = todas.size();
        double mediaConsumoKwh = todas.stream().mapToDouble(AnaliseEnergia::getConsumoKwh).average().orElse(0.0);
        double totalCustoEstimado = todas.stream().mapToDouble(AnaliseEnergia::getCustoEstimadoMensal).sum();
        double totalEmissaoCo2Kg = todas.stream().mapToDouble(a -> a.getConsumoKwh() * 0.096).sum();

        TreeMap<YearMonth, Double> consumoPorAnoMes = todas.stream()
                .filter(a -> a.getCreatedAt() != null)
                .collect(Collectors.groupingBy(
                        a -> YearMonth.from(a.getCreatedAt()),
                        TreeMap::new,
                        Collectors.summingDouble(AnaliseEnergia::getConsumoKwh)
                ));

        List<ConsumoMesDTO> consumoPorMes = consumoPorAnoMes.entrySet().stream()
                .map(entry -> {
                    String mesNome = entry.getKey().getMonth().getDisplayName(TextStyle.SHORT, new Locale("pt", "BR"));
                    mesNome = mesNome.replace(".", "");
                    if (mesNome.length() > 0) {
                        mesNome = mesNome.substring(0, 1).toUpperCase() + mesNome.substring(1);
                    }
                    return new ConsumoMesDTO(mesNome, entry.getValue());
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(new DashboardDTO(
                totalAnalises,
                mediaConsumoKwh,
                totalCustoEstimado,
                totalEmissaoCo2Kg,
                consumoPorMes
        ));
    }

    public record DashboardDTO(
            int totalAnalises,
            double mediaConsumoKwh,
            double totalCustoEstimado,
            double totalEmissaoCo2Kg,
            List<ConsumoMesDTO> consumoPorMes
    ) {}

    public record ConsumoMesDTO(
            String mes,
            double consumoKwh
    ) {}
}
