package br.com.group18.energiai.infrastructure.config;

import br.com.group18.energiai.core.ports.out.PasswordHasherPort;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class BcryptPasswordHasher implements PasswordHasherPort {

    private static final Logger log = LoggerFactory.getLogger(BcryptPasswordHasher.class);

    private final PasswordEncoder passwordEncoder;

    public BcryptPasswordHasher(PasswordEncoder passwordEncoder) {
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public String encode(String rawPassword) {
        return passwordEncoder.encode(rawPassword);
    }

    @Override
    public boolean matches(String rawPassword, String storedHash) {
        if (isBcryptHash(storedHash)) {
            return passwordEncoder.matches(rawPassword, storedHash);
        }
        return verifyLegacySha256(rawPassword, storedHash);
    }

    private boolean isBcryptHash(String hash) {
        return hash.startsWith("$2a$") || hash.startsWith("$2b$") || hash.startsWith("$2y$");
    }

    private boolean verifyLegacySha256(String password, String storedHash) {
        try {
            byte[] saltAndHash = Base64.getDecoder().decode(storedHash);
            byte[] salt = new byte[16];
            System.arraycopy(saltAndHash, 0, salt, 0, salt.length);

            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            digest.update(salt);
            byte[] hash = digest.digest(password.getBytes(StandardCharsets.UTF_8));

            byte[] expectedHash = new byte[hash.length];
            System.arraycopy(saltAndHash, salt.length, expectedHash, 0, hash.length);

            return MessageDigest.isEqual(hash, expectedHash);
        } catch (Exception exception) {
            log.warn("Erro ao verificar senha SHA-256 legada", exception);
            return false;
        }
    }
}
