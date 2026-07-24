package br.com.group18.energiai.core.ports.in;

import br.com.group18.energiai.core.domain.model.EnergyAnalysis;
import br.com.group18.energiai.core.domain.model.Property;
import br.com.group18.energiai.core.domain.model.PropertyAppliance;
import java.math.BigDecimal;
import java.util.List;

public interface GenerateAnalysisUseCase {
    EnergyAnalysis execute(
            Property property,
            List<PropertyAppliance> appliances,
            BigDecimal consumptionKwh,
            Boolean peakHourUsage,
            BigDecimal highConsumptionHours,
            String highestConsumptionCategory);
}
