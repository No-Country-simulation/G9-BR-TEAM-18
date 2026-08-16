package br.com.group18.energiai;

import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.mock;

import br.com.group18.energiai.application.services.ApplianceAggregationService;
import br.com.group18.energiai.application.services.ApplianceCatalogSyncService;
import br.com.group18.energiai.application.services.AuthenticationService;
import br.com.group18.energiai.application.services.DashboardService;
import br.com.group18.energiai.application.services.EnergyAnalysisService;
import br.com.group18.energiai.application.services.PropertyService;
import br.com.group18.energiai.core.ports.out.AnalysisRepositoryPort;
import br.com.group18.energiai.core.ports.out.ApplianceRepositoryPort;
import br.com.group18.energiai.core.ports.out.EnergyPredictionPort;
import br.com.group18.energiai.core.ports.out.MlContractPort;
import br.com.group18.energiai.core.ports.out.PasswordHasherPort;
import br.com.group18.energiai.core.ports.out.PropertyApplianceRepositoryPort;
import br.com.group18.energiai.core.ports.out.PropertyRepositoryPort;
import br.com.group18.energiai.core.ports.out.UserRepositoryPort;
import br.com.group18.energiai.infrastructure.config.ApplicationBeansConfig;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

class ApplicationBeansConfigTest {

    @Test
    void shouldWireAllApplicationServicesWithTheirPorts() {
        ApplicationBeansConfig config = new ApplicationBeansConfig();

        UserRepositoryPort userRepository = mock(UserRepositoryPort.class);
        PasswordHasherPort passwordHasher = mock(PasswordHasherPort.class);
        PropertyRepositoryPort propertyRepository = mock(PropertyRepositoryPort.class);
        ApplianceRepositoryPort applianceRepository = mock(ApplianceRepositoryPort.class);
        PropertyApplianceRepositoryPort propertyApplianceRepository = mock(PropertyApplianceRepositoryPort.class);
        AnalysisRepositoryPort analysisRepository = mock(AnalysisRepositoryPort.class);
        EnergyPredictionPort predictionPort = mock(EnergyPredictionPort.class);
        MlContractPort mlContract = mock(MlContractPort.class);
        ApplianceAggregationService aggregationService = mock(ApplianceAggregationService.class);

        assertInstanceOf(AuthenticationService.class, config.authenticationService(userRepository, passwordHasher));
        assertInstanceOf(
                PropertyService.class,
                config.propertyService(propertyRepository, applianceRepository, propertyApplianceRepository));
        assertInstanceOf(
                EnergyAnalysisService.class,
                config.energyAnalysisService(
                        analysisRepository, predictionPort, aggregationService, new BigDecimal("0.75")));
        assertInstanceOf(
                ApplianceCatalogSyncService.class, config.applianceCatalogSyncService(mlContract, applianceRepository));
        assertInstanceOf(DashboardService.class, config.dashboardService(propertyRepository, analysisRepository, 0.5));
        assertNotNull(config.applianceAggregationService());
    }
}
