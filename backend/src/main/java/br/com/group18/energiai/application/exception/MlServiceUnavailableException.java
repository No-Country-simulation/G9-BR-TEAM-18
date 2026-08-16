package br.com.group18.energiai.application.exception;

public class MlServiceUnavailableException extends RuntimeException {

    public MlServiceUnavailableException(String message) {
        super(message);
    }
}
