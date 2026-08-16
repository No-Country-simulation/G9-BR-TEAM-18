package br.com.group18.energiai.infrastructure.config;

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
import java.math.BigDecimal;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ApplicationBeansConfig {

    @Bean
    public ApplianceAggregationService applianceAggregationService() {
        return new ApplianceAggregationService();
    }

    @Bean
    public AuthenticationService authenticationService(
            UserRepositoryPort userRepository, PasswordHasherPort passwordHasher) {
        return new AuthenticationService(userRepository, passwordHasher);
    }

    @Bean
    public PropertyService propertyService(
            PropertyRepositoryPort propertyRepository,
            ApplianceRepositoryPort applianceRepository,
            PropertyApplianceRepositoryPort propertyApplianceRepository) {
        return new PropertyService(propertyRepository, applianceRepository, propertyApplianceRepository);
    }

    @Bean
    public EnergyAnalysisService energyAnalysisService(
            AnalysisRepositoryPort analysisRepository,
            EnergyPredictionPort predictionPort,
            ApplianceAggregationService aggregationService,
            @Value("${KWH_TARIFF:0.75}") BigDecimal kwhTariff) {
        return new EnergyAnalysisService(analysisRepository, predictionPort, aggregationService, kwhTariff);
    }

    @Bean
    public ApplianceCatalogSyncService applianceCatalogSyncService(
            MlContractPort mlContract, ApplianceRepositoryPort applianceRepository) {
        return new ApplianceCatalogSyncService(mlContract, applianceRepository);
    }

    @Bean
    public DashboardService dashboardService(
            PropertyRepositoryPort propertyRepository,
            AnalysisRepositoryPort analysisRepository,
            @Value("${CO2_EMISSION_FACTOR}") double co2EmissionFactor) {
        return new DashboardService(propertyRepository, analysisRepository, co2EmissionFactor);
    }
}
