package br.com.group18.energiai;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import br.com.group18.energiai.core.ports.out.PasswordHasherPort;
import br.com.group18.energiai.infrastructure.config.BcryptPasswordHasher;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

class BcryptPasswordHasherTest {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private PasswordEncoder passwordEncoder;
    private PasswordHasherPort hasher;

    @BeforeEach
    void setUp() {
        passwordEncoder = mock(PasswordEncoder.class);
        hasher = new BcryptPasswordHasher(passwordEncoder);
    }

    @Test
    void shouldDelegateEncodingToPasswordEncoder() {
        when(passwordEncoder.encode("senha123")).thenReturn("$2a$10$encoded");

        String encoded = hasher.encode("senha123");

        assertEquals("$2a$10$encoded", encoded);
    }

    @Test
    void shouldUseBcryptComparisonForBcryptHashes() {
        when(passwordEncoder.matches("senha123", "$2a$10$hash")).thenReturn(true);

        assertTrue(hasher.matches("senha123", "$2a$10$hash"));
    }

    @Test
    void shouldRecognizeAllBcryptPrefixes() {
        when(passwordEncoder.matches("senha", "$2b$10$hash")).thenReturn(true);
        when(passwordEncoder.matches("senha", "$2y$10$hash")).thenReturn(true);

        assertTrue(hasher.matches("senha", "$2b$10$hash"));
        assertTrue(hasher.matches("senha", "$2y$10$hash"));
        verify(passwordEncoder).matches("senha", "$2b$10$hash");
        verify(passwordEncoder).matches("senha", "$2y$10$hash");
    }

    @Test
    void shouldVerifyLegacySha256HashWithMatchingPassword() {
        String storedHash = legacySha256Hash("senhaLegada");

        assertTrue(hasher.matches("senhaLegada", storedHash));
    }

    @Test
    void shouldRejectLegacySha256HashWithWrongPassword() {
        String storedHash = legacySha256Hash("senhaCorreta");

        assertFalse(hasher.matches("senhaErrada", storedHash));
    }

    @Test
    void shouldReturnFalseForMalformedLegacyHash() {
        assertFalse(hasher.matches("qualquer", "não-é-base64-válido!!!"));
    }

    private String legacySha256Hash(String password) {
        byte[] salt = new byte[16];
        SECURE_RANDOM.nextBytes(salt);
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            digest.update(salt);
            byte[] hash = digest.digest(password.getBytes(StandardCharsets.UTF_8));

            byte[] saltAndHash = new byte[salt.length + hash.length];
            System.arraycopy(salt, 0, saltAndHash, 0, salt.length);
            System.arraycopy(hash, 0, saltAndHash, salt.length, hash.length);
            return Base64.getEncoder().encodeToString(saltAndHash);
        } catch (Exception exception) {
            throw new IllegalStateException(exception);
        }
    }
}
