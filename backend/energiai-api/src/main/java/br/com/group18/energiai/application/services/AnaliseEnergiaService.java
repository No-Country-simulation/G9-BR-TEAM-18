package br.com.group18.energiai.application.services;

import br.com.group18.energiai.core.domain.model.AnaliseEnergia;
import br.com.group18.energiai.core.ports.in.GerarAnaliseUseCase;
import br.com.group18.energiai.core.ports.out.AnaliseRepositoryPort;

import java.util.ArrayList;
import java.util.List;

public class AnaliseEnergiaService implements GerarAnaliseUseCase {

    private static final double TARIFA_KWH = 0.75;

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

        if (consumoKwh > 350 || horasAltoConsumo > 7) {
            analise.setCategoria("ALTO");
            analise.setProbabilidade(0.85);
        } else if (consumoKwh < 150) {
            analise.setCategoria("EFICIENTE");
            analise.setProbabilidade(0.90);
        } else {
            analise.setCategoria("MODERADO");
            analise.setProbabilidade(0.75);
        }

        analise.setCustoEstimadoMensal(consumoKwh * TARIFA_KWH);

        List<String> recomendacoes = new ArrayList<>();
        if (Boolean.TRUE.equals(usoHorarioPico)) {
            recomendacoes.add("Reduzir o uso de equipamentos potentes durante os horários de pico (18h às 21h).");
        }
        if (consumoKwh > 300) {
            recomendacoes.add("Considere substituir equipamentos antigos por modelos mais eficientes.");
        }
        if (quantidadeEquipamentos > 10) {
            recomendacoes.add("Avalie a real necessidade de todos os equipamentos ligados simultaneamente.");
        }
        if (horasAltoConsumo > 5) {
            recomendacoes.add("Distribua o uso de equipamentos ao longo do dia para reduzir o horário de alto consumo.");
        }
        if (recomendacoes.isEmpty()) {
            recomendacoes.add("Mantenha o bom acompanhamento dos seus hábitos de consumo!");
        }
        analise.setRecomendacoes(recomendacoes);

        return repository.salvar(analise);
    }
}
