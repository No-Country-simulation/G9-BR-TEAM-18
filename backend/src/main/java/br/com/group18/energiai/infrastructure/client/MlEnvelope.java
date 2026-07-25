package br.com.group18.energiai.infrastructure.client;

import java.util.Collections;
import java.util.Map;
import java.util.Objects;

public record MlEnvelope(Map<String, Object> body, Map<String, String> metadata) {

    public MlEnvelope {
        Objects.requireNonNull(body, "body must not be null");
        body = Collections.unmodifiableMap(body);
        metadata = metadata == null ? Map.of() : Collections.unmodifiableMap(metadata);
    }

    public MlEnvelope(Map<String, Object> body) {
        this(body, Map.of());
    }

    @SuppressWarnings("unchecked")
    public <T> T get(String key) {
        return (T) body.get(key);
    }

    public boolean hasKey(String key) {
        return body.containsKey(key);
    }
}
