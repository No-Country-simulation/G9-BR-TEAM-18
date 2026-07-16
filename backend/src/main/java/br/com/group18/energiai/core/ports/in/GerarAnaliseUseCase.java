package br.com.group18.energiai.core.ports.in;

import br.com.group18.energiai.core.domain.model.AnaliseEnergia;

public interface GerarAnaliseUseCase {
    AnaliseEnergia executar(Double consumoKwh, Boolean usoHorarioPico, Integer quantidadeEquipamentos,
                            String tipoImovel, Double horasAltoConsumo);
}
