package br.com.group18.energiai.application.services;

import br.com.group18.energiai.core.domain.model.AnaliseEnergia;
import br.com.group18.energiai.core.ports.in.GerarAnaliseUseCase;
import br.com.group18.energiai.core.ports.out.AnaliseRepositoryPort;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class AnaliseEnergiaService implements GerarAnaliseUseCase {

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

    public AnaliseEnergiaService(AnaliseRepositoryPort repository) {
        this.repository = repository;
    }

    @Override
    public AnaliseEnergia executar(Double consumoKwh, Boolean usoHorarioPico,
                                   Integer quantidadeEquipamentos, String tipoImovel,
                                   Double horasAltoConsumo) {
        AnaliseEnergia analise = new AnaliseEnergia(
                consumoKwh, usoHorarioPico, quantidadeEquipamentos, tipoImovel, horasAltoConsumo
        );

        double indice = calcularIndiceIneficiencia(consumoKwh, usoHorarioPico,
                quantidadeEquipamentos, tipoImovel, horasAltoConsumo);

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
        analise.setCustoEstimadoMensal(consumoKwh * TARIFA_KWH);

        List<String> recomendacoes = new ArrayList<>();
        if (Boolean.TRUE.equals(usoHorarioPico)) {
            recomendacoes.add("Reduzir o uso de equipamentos potentes durante os horários de pico (18h às 21h).");
        }
        if ("RUIM".equals(categoria) || "CRITICO".equals(categoria)) {
            recomendacoes.add("Considere substituir equipamentos antigos por modelos mais eficientes.");
        }
        if (quantidadeEquipamentos > 10) {
            recomendacoes.add("Avalie a real necessidade de todos os equipamentos ligados simultaneamente.");
        }
        if (horasAltoConsumo > 5) {
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
