package br.com.group18.energiai.infrastructure.client;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Registry that stores the ML Service's schema and valid categories
 * discovered at startup via {@link MlSchemaDiscovery}.
 */
@Component
public class MlSchemaRegistry {

    private static final Logger log = LoggerFactory.getLogger(MlSchemaRegistry.class);

    private final List<String> defaultCategories;

    private volatile Map<String, Object> schema = Map.of();
    private volatile List<String> categories;

    public MlSchemaRegistry(@Value("${ML_DEFAULT_CATEGORIES}") List<String> defaultCategories) {
        this.defaultCategories = List.copyOf(defaultCategories);
        this.categories = this.defaultCategories;
    }

    public void register(Map<String, Object> schema, List<String> categories) {
        this.schema = schema == null ? Map.of() : Collections.unmodifiableMap(schema);
        this.categories = categories == null || categories.isEmpty()
                ? defaultCategories
                : Collections.unmodifiableList(categories);
        log.info(
                "Schema Discovery: registered {} schema fields and {} categories",
                this.schema.size(),
                this.categories.size());
    }

    public Map<String, Object> getSchema() {
        return schema;
    }

    public List<String> getCategories() {
        return categories;
    }
}
