package br.com.group18.energiai.infrastructure.client;

import java.util.Collections;
import java.util.Map;
import java.util.Objects;

public record MlEnvelope(Map<String, Object> body) {

    public MlEnvelope {
        Objects.requireNonNull(body, "body must not be null");
        body = Collections.unmodifiableMap(body);
    }

    @SuppressWarnings("unchecked")
    public <T> T get(String key) {
        return (T) body.get(key);
    }
}
