package br.com.group18.energiai.infrastructure.client;

/**
 * Thrown when the ML Service is unreachable or returns no response.
 * Triggers a 503 response in the GlobalExceptionHandler.
 */
public class MlServiceUnavailableException extends RuntimeException {

    public MlServiceUnavailableException(String message) {
        super(message);
    }

    public MlServiceUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }
}
