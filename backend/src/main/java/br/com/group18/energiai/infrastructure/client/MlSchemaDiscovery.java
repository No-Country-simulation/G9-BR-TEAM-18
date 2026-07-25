package br.com.group18.energiai.infrastructure.client;

import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class MlSchemaDiscovery implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(MlSchemaDiscovery.class);

    private final MlServiceClient mlServiceClient;
    private final MlSchemaRegistry registry;

    public MlSchemaDiscovery(MlServiceClient mlServiceClient, MlSchemaRegistry registry) {
        this.mlServiceClient = mlServiceClient;
        this.registry = registry;
    }

    @Override
    public void run(ApplicationArguments args) {
        try {
            log.info("Schema Discovery: fetching schema and categories from ML Service...");

            Map<String, Object> schema = mlServiceClient.fetchSchema();
            List<String> categories = mlServiceClient.fetchCategories();

            registry.register(schema, categories);

            log.info(
                    "Schema Discovery: completed successfully. {} categories discovered: {}",
                    categories.size(),
                    categories);
        } catch (Exception e) {
            log.warn("Schema Discovery: ML Service unavailable during startup ({}). Using defaults.", e.getMessage());
            registry.register(null, null);
        }
    }
}
