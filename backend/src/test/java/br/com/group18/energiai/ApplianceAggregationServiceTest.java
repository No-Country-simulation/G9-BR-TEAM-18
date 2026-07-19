package br.com.group18.energiai;

import static org.junit.jupiter.api.Assertions.assertEquals;

import br.com.group18.energiai.application.services.ApplianceAggregationService;
import br.com.group18.energiai.core.domain.model.Appliance;
import br.com.group18.energiai.core.domain.model.PropertyAppliance;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class ApplianceAggregationServiceTest {

    private ApplianceAggregationService service;

    @BeforeEach
    void setUp() {
        service = new ApplianceAggregationService();
    }

    @Test
    void shouldAggregateAppliancesCorrectly() {
        Appliance geladeira =
                new Appliance(1L, "Geladeira", "Refrigeracao", new BigDecimal("150.0"), new BigDecimal("24.0"));
        Appliance arCondicionado =
                new Appliance(2L, "Ar Condicionado", "Climatizacao", new BigDecimal("1500.0"), new BigDecimal("8.0"));
        Appliance chuveiro =
                new Appliance(3L, "Chuveiro Eletrico", "Aquecimento", new BigDecimal("5500.0"), new BigDecimal("0.5"));
        Appliance lampada =
                new Appliance(4L, "Lampada LED", "Iluminacao", new BigDecimal("12.0"), new BigDecimal("6.0"));

        PropertyAppliance pa1 = new PropertyAppliance(1L, geladeira, 1);
        PropertyAppliance pa2 = new PropertyAppliance(1L, arCondicionado, 2);
        PropertyAppliance pa3 = new PropertyAppliance(1L, chuveiro, 1);
        PropertyAppliance pa4 = new PropertyAppliance(1L, lampada, 5);

        ApplianceAggregationService.AggregationResult result = service.aggregate(List.of(pa1, pa2, pa3, pa4));

        assertEquals(9, result.totalEquipment());
        assertEquals(150.0, result.refrigerationWatts());
        assertEquals(3000.0, result.airConditioningWatts());
        assertEquals(5500.0, result.heatingWatts());
        assertEquals(60.0, result.lightingWatts());
    }
}
