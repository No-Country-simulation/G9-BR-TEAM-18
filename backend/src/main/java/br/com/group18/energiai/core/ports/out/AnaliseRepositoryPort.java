package br.com.group18.energiai.core.ports.out;

import br.com.group18.energiai.core.domain.model.AnaliseEnergia;
import java.util.List;

public interface AnaliseRepositoryPort {
    AnaliseEnergia salvar(AnaliseEnergia analise);
    List<AnaliseEnergia> listarTodas();
}
