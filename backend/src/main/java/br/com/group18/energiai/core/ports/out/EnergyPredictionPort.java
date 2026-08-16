package br.com.group18.energiai.core.ports.out;

import br.com.group18.energiai.core.domain.model.MlResult;

public interface EnergyPredictionPort {
    MlResult predict(PredictionInput input);

    MlResult predictSimulated(PredictionInput input);
}
