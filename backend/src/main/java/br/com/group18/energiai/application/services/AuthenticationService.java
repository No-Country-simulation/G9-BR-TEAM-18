package br.com.group18.energiai.application.services;

import br.com.group18.energiai.core.domain.model.User;
import br.com.group18.energiai.core.ports.out.UserRepositoryPort;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthenticationService {

    private static final Logger log = LoggerFactory.getLogger(AuthenticationService.class);

    private final UserRepositoryPort userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthenticationService(UserRepositoryPort userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public User register(String name, String email, String password) {
        if (userRepository.findByEmail(email).isPresent()) {
            throw new IllegalArgumentException("E-mail já cadastrado");
        }

        String passwordHash = passwordEncoder.encode(password);
        User user = new User(name, email, passwordHash);
        return userRepository.save(user);
    }

    public Optional<User> login(String email, String password) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return Optional.empty();
        }
        User user = userOpt.get();
        String storedHash = user.getPasswordHash();
        if (storedHash == null || storedHash.isEmpty()) {
            return Optional.empty();
        }
        boolean matches;
        if (isBcryptHash(storedHash)) {
            matches = passwordEncoder.matches(password, storedHash);
        } else {
            matches = verifySha256(password, storedHash);
        }
        if (!matches) {
            return Optional.empty();
        }
        return userOpt;
    }

    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    public User resetPassword(Long userId, String currentPassword, String newPassword) {
        User user = userRepository
                .findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado"));

        String storedHash = user.getPasswordHash();
        boolean currentValid;
        if (isBcryptHash(storedHash)) {
            currentValid = passwordEncoder.matches(currentPassword, storedHash);
        } else {
            currentValid = verifySha256(currentPassword, storedHash);
        }
        if (!currentValid) {
            throw new IllegalArgumentException("Senha atual inválida");
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setPasswordResetRequired(false);
        return userRepository.save(user);
    }

    private boolean isBcryptHash(String hash) {
        return hash.startsWith("$2a$") || hash.startsWith("$2b$") || hash.startsWith("$2y$");
    }

    // ---- SHA-256 legacy methods (for existing users before BCrypt migration) ----

    private boolean verifySha256(String password, String storedHash) {
        try {
            byte[] saltHash = Base64.getDecoder().decode(storedHash);
            byte[] salt = new byte[16];
            System.arraycopy(saltHash, 0, salt, 0, salt.length);

            MessageDigest md = MessageDigest.getInstance("SHA-256");
            md.update(salt);
            byte[] hash = md.digest(password.getBytes(java.nio.charset.StandardCharsets.UTF_8));

            byte[] expectedHash = new byte[hash.length];
            System.arraycopy(saltHash, salt.length, expectedHash, 0, hash.length);

            return MessageDigest.isEqual(hash, expectedHash);
        } catch (Exception e) {
            log.warn("Erro ao verificar senha SHA-256 legada", e);
            return false;
        }
    }
}
