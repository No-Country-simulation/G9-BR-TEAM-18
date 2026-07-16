package br.com.group18.energiai.application.services;

import br.com.group18.energiai.core.domain.model.AnaliseEnergia;
import br.com.group18.energiai.core.ports.in.GerarAnaliseUseCase;
import br.com.group18.energiai.core.ports.out.AnaliseRepositoryPort;
import br.com.group18.energiai.infrastructure.client.MlServiceClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class AnaliseEnergiaService implements GerarAnaliseUseCase {

    private static final Logger log = LoggerFactory.getLogger(AnaliseEnergiaService.class);

    private static final double TARIFA_KWH = 0.75;

    private static final Map<String, Double> CONSUMO_BASE_POR_TIPO = Map.of(
            "Casa", 250.0,
            "Apartamento", 150.0,
            "Comercio", 500.0,
            "Industria", 800.0,
            "Rural", 300.0,
            "Outro", 250.0
    );

    private final AnaliseRepositoryPort repository;
    private final MlServiceClient mlServiceClient;

    public AnaliseEnergiaService(AnaliseRepositoryPort repository, MlServiceClient mlServiceClient) {
        this.repository = repository;
        this.mlServiceClient = mlServiceClient;
    }

    @Override
    public AnaliseEnergia executar(Double consumoKwh, Boolean usoHorarioPico,
                                   Integer quantidadeEquipamentos, String tipoImovel,
                                   Double horasAltoConsumo) {
        AnaliseEnergia analise = new AnaliseEnergia(
                consumoKwh, usoHorarioPico, quantidadeEquipamentos, tipoImovel, horasAltoConsumo
        );

        var mlResponse = mlServiceClient.predict(new MlServiceClient.MlPredictRequest(
                consumoKwh, usoHorarioPico, quantidadeEquipamentos, tipoImovel, horasAltoConsumo
        ));

        if (mlResponse != null) {
            log.info("Resposta do ML Service: {} (confiança: {}, origem: {})",
                    mlResponse.categoria(), mlResponse.probabilidade(), mlResponse.origem());

            if (mlResponse.origem().contains("groq")) {
                log.info("Confiança abaixo de 80% — Groq seria acionado se configurado");
            }

            analise.setCategoria(mlResponse.categoria());
            analise.setProbabilidade(mlResponse.probabilidade());
            analise.setRecomendacoes(mlResponse.recomendacoes());
            analise.setOrigem(mlResponse.origem());
            analise.setCustoEstimadoMensal(consumoKwh * TARIFA_KWH);

            return repository.salvar(analise);
        }

        log.info("ML Service indisponível — usando fallback rule-based");
        return executarRuleBased(analise);
    }

    private AnaliseEnergia executarRuleBased(AnaliseEnergia analise) {
        double indice = calcularIndiceIneficiencia(
                analise.getConsumoKwh(), analise.getUsoHorarioPico(),
                analise.getQuantidadeEquipamentos(), analise.getTipoImovel(),
                analise.getHorasAltoConsumo()
        );

        String categoria;
        double probabilidade;
        if (indice < 0.2) {
            categoria = "EXCELENTE";
            probabilidade = 0.92;
        } else if (indice < 0.4) {
            categoria = "BOM";
            probabilidade = 0.85;
        } else if (indice < 0.6) {
            categoria = "MEDIANO";
            probabilidade = 0.78;
        } else if (indice < 0.8) {
            categoria = "RUIM";
            probabilidade = 0.82;
        } else {
            categoria = "CRITICO";
            probabilidade = 0.90;
        }

        analise.setCategoria(categoria);
        analise.setProbabilidade(probabilidade);
        analise.setOrigem("rule-based (backend)");
        analise.setCustoEstimadoMensal(analise.getConsumoKwh() * TARIFA_KWH);

        List<String> recomendacoes = new ArrayList<>();
        if (Boolean.TRUE.equals(analise.getUsoHorarioPico())) {
            recomendacoes.add("Reduzir o uso de equipamentos potentes durante os horários de pico (18h às 21h).");
        }
        if ("RUIM".equals(categoria) || "CRITICO".equals(categoria)) {
            recomendacoes.add("Considere substituir equipamentos antigos por modelos mais eficientes.");
        }
        if (analise.getQuantidadeEquipamentos() > 10) {
            recomendacoes.add("Avalie a real necessidade de todos os equipamentos ligados simultaneamente.");
        }
        if (analise.getHorasAltoConsumo() > 5) {
            recomendacoes.add("Distribua o uso de equipamentos ao longo do dia para reduzir o horário de alto consumo.");
        }
        if ("EXCELENTE".equals(categoria)) {
            recomendacoes.add("Continue mantendo as boas práticas de eficiência energética!");
        } else if (recomendacoes.isEmpty()) {
            recomendacoes.add("Mantenha o bom acompanhamento dos seus hábitos de consumo!");
        }
        analise.setRecomendacoes(recomendacoes);

        return repository.salvar(analise);
    }

    private double calcularIndiceIneficiencia(Double consumoKwh, Boolean usoHorarioPico,
                                               Integer quantidadeEquipamentos, String tipoImovel,
                                               Double horasAltoConsumo) {
        double base = CONSUMO_BASE_POR_TIPO.getOrDefault(tipoImovel, 250.0);
        double consumoRelativo = consumoKwh / base;
        double consumoNorm = Math.min(consumoRelativo / 3.0, 1.0);
        double equipNorm = Math.min(quantidadeEquipamentos / 25.0, 1.0);
        double horasNorm = Math.min(horasAltoConsumo / 12.0, 1.0);
        double picoNorm = Boolean.TRUE.equals(usoHorarioPico) ? 1.0 : 0.0;

        return 0.40 * consumoNorm + 0.25 * picoNorm + 0.20 * equipNorm + 0.15 * horasNorm;
    }
}
