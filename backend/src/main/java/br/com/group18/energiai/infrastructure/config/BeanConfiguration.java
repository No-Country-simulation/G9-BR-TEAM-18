package br.com.group18.energiai.infrastructure.config;

import br.com.group18.energiai.application.services.EnergyAnalysisService;
import br.com.group18.energiai.core.ports.out.AnalysisRepositoryPort;
import br.com.group18.energiai.infrastructure.client.MlServiceClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class BeanConfiguration {

    @Bean
    public EnergyAnalysisService energyAnalysisService(
            AnalysisRepositoryPort repository, MlServiceClient mlServiceClient) {
        return new EnergyAnalysisService(repository, mlServiceClient);
    }
}
