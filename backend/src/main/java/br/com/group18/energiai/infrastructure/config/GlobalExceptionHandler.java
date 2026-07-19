package br.com.group18.energiai.infrastructure.config;

import br.com.group18.energiai.application.exception.ForbiddenOperationException;
import br.com.group18.energiai.application.exception.InvalidRequestException;
import br.com.group18.energiai.application.exception.ResourceNotFoundException;
import br.com.group18.energiai.infrastructure.client.MlServiceUnavailableException;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import java.util.HashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);
    private static final PropertyNamingStrategies.NamingBase STRATEGY =
            (PropertyNamingStrategies.NamingBase) PropertyNamingStrategies.SNAKE_CASE;

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException exception) {
        Map<String, String> fields = new HashMap<>();
        exception.getBindingResult()
                .getFieldErrors()
                .forEach(error -> fields.put(STRATEGY.translate(error.getField()), error.getDefaultMessage()));

        Map<String, Object> body = new HashMap<>();
        body.put("message", "Erro de validação");
        body.put("fields", fields);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    @ExceptionHandler(InvalidRequestException.class)
    public ResponseEntity<Map<String, String>> handleInvalidRequest(InvalidRequestException exception) {
        return response(HttpStatus.BAD_REQUEST, exception.getMessage());
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleNotFound(ResourceNotFoundException exception) {
        return response(HttpStatus.NOT_FOUND, exception.getMessage());
    }

    @ExceptionHandler(ForbiddenOperationException.class)
    public ResponseEntity<Map<String, String>> handleForbidden(ForbiddenOperationException exception) {
        return response(HttpStatus.FORBIDDEN, exception.getMessage());
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, String>> handleConstraintViolation(DataIntegrityViolationException exception) {
        log.warn("Violação de integridade: {}", exception.getMostSpecificCause().getMessage());
        return response(HttpStatus.CONFLICT, "A operação viola uma restrição de dados.");
    }

    @ExceptionHandler(MlServiceUnavailableException.class)
    public ResponseEntity<Map<String, String>> handleMlUnavailable(MlServiceUnavailableException exception) {
        log.warn("ML Service indisponível: {}", exception.getMessage());
        return response(HttpStatus.SERVICE_UNAVAILABLE, exception.getMessage());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleGeneric(Exception exception) {
        log.error("Erro interno", exception);
        return response(HttpStatus.INTERNAL_SERVER_ERROR, "Erro interno do servidor");
    }

    private ResponseEntity<Map<String, String>> response(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(Map.of("message", message));
    }
}
