package br.com.group18.energiai.core.ports.out;

public interface PasswordHasherPort {
    String encode(String rawPassword);

    boolean matches(String rawPassword, String storedHash);
}
