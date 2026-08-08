package br.com.group18.energiai.infrastructure.client;

import br.com.group18.energiai.application.exception.MlServiceUnavailableException;
import br.com.group18.energiai.core.domain.model.MlResult;
import br.com.group18.energiai.core.ports.out.EnergyPredictionPort;
import br.com.group18.energiai.core.ports.out.PredictionInput;
import java.util.HashMap;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class MlPredictionAdapter implements EnergyPredictionPort {

    private static final String SERVICE_UNAVAILABLE_MESSAGE =
            "Serviço de análise temporariamente indisponível. Tente novamente em instantes.";

    private final MlServiceClient mlServiceClient;
    private final AnalysisMapper responseMapper;

    public MlPredictionAdapter(MlServiceClient mlServiceClient, AnalysisMapper responseMapper) {
        this.mlServiceClient = mlServiceClient;
        this.responseMapper = responseMapper;
    }

    @Override
    public MlResult predict(PredictionInput input) {
        return toResultOrThrow(mlServiceClient.predict(toEnvelope(input)));
    }

    @Override
    public MlResult predictSimulated(PredictionInput input) {
        return toResultOrThrow(mlServiceClient.predictSimulate(toEnvelope(input)));
    }

    private MlResult toResultOrThrow(MlEnvelope response) {
        if (response == null) {
            throw new MlServiceUnavailableException(SERVICE_UNAVAILABLE_MESSAGE);
        }
        return responseMapper.toMlResult(response);
    }

    private MlEnvelope toEnvelope(PredictionInput input) {
        Map<String, Object> distribution = Map.of(
                "REFRIGERATION_WATTS", input.powerDistribution().refrigerationWatts(),
                "HEATING_WATTS", input.powerDistribution().heatingWatts(),
                "AIR_CONDITIONING_WATTS", input.powerDistribution().airConditioningWatts(),
                "LIGHTING_WATTS", input.powerDistribution().lightingWatts());

        Map<String, Object> body = new HashMap<>();
        body.put("consumption_kwh", input.consumptionKwh());
        body.put("peak_hour_usage", input.peakHourUsage());
        body.put("equipment_quantity", input.equipmentQuantity());
        body.put("property_type", input.propertyType());
        body.put("high_consumption_hours", input.highConsumptionHours());
        body.put("daily_consumption_distribution", distribution);
        if (input.highestConsumptionCategory() != null
                && !input.highestConsumptionCategory().isBlank()) {
            body.put("highest_consumption_category", input.highestConsumptionCategory());
        }
        if (input.highestConsumptionProducts() != null
                && !input.highestConsumptionProducts().isEmpty()) {
            body.put("highest_consumption_products", input.highestConsumptionProducts());
        }
        return new MlEnvelope(body);
    }
}
