package br.com.group18.energiai.infrastructure.config;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import java.util.HashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> fields = new HashMap<>();
        ex.getBindingResult()
                .getFieldErrors()
                .forEach(err -> fields.put(STRATEGY.translate(err.getField()), err.getDefaultMessage()));

        Map<String, Object> body = new HashMap<>();
        body.put("message", "Erro de validação");
        body.put("fields", fields);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleGeneric(Exception ex) {
        log.error("Erro interno", ex);
        Map<String, String> body = new HashMap<>();
        body.put("message", "Erro interno do servidor");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }
}
