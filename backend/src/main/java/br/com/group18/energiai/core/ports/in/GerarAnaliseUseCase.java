package br.com.group18.energiai.core.ports.in;

import br.com.group18.energiai.core.domain.model.AnaliseEnergia;

public interface GerarAnaliseUseCase {
    AnaliseEnergia executar(Double consumoKwh, Boolean usoHorarioPico, Integer quantidadeEquipamentos,
                            String tipoImovel, Double horasAltoConsumo,
                            String categoriaMaiorConsumo,
                            Double refrigWatts, Double aquecimentoWatts,
                            Double climatizacaoWatts, Double iluminacaoWatts);

    default AnaliseEnergia executar(Double consumoKwh, Boolean usoHorarioPico, Integer quantidadeEquipamentos,
                                    String tipoImovel, Double horasAltoConsumo) {
        return executar(consumoKwh, usoHorarioPico, quantidadeEquipamentos, tipoImovel, horasAltoConsumo,
                "Outros", 0.0, 0.0, 0.0, 0.0);
    }
}
