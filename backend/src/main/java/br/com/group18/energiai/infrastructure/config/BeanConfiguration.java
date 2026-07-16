package br.com.group18.energiai.infrastructure.config;

import br.com.group18.energiai.application.services.AnaliseEnergiaService;
import br.com.group18.energiai.core.ports.out.AnaliseRepositoryPort;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class BeanConfiguration {

    @Bean
    public AnaliseEnergiaService analiseEnergiaService(AnaliseRepositoryPort repository) {
        return new AnaliseEnergiaService(repository);
    }
}
