package br.com.group18.energiai.application.services;

import br.com.group18.energiai.core.domain.model.User;
import br.com.group18.energiai.core.ports.out.UserRepositoryPort;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class AuthenticationService {

    private static final Logger log = LoggerFactory.getLogger(AuthenticationService.class);

    private final UserRepositoryPort userRepository;

    public AuthenticationService(UserRepositoryPort userRepository) {
        this.userRepository = userRepository;
    }

    public User register(String name, String email, String password) {
        if (userRepository.findByEmail(email).isPresent()) {
            throw new IllegalArgumentException("E-mail já cadastrado");
        }

        String passwordHash = hashPassword(password);
        User user = new User(name, email, passwordHash);
        return userRepository.save(user);
    }

    public Optional<User> login(String email, String password) {
        return userRepository.findByEmail(email).filter(u -> verifyPassword(password, u.getPasswordHash()));
    }

    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    private static final SecureRandom RANDOM = new SecureRandom();

    private String hashPassword(String password) {
        try {
            byte[] salt = new byte[16];
            RANDOM.nextBytes(salt);

            MessageDigest md = MessageDigest.getInstance("SHA-256");
            md.update(salt);
            byte[] hash = md.digest(password.getBytes(java.nio.charset.StandardCharsets.UTF_8));

            byte[] saltHash = new byte[salt.length + hash.length];
            System.arraycopy(salt, 0, saltHash, 0, salt.length);
            System.arraycopy(hash, 0, saltHash, salt.length, hash.length);

            return Base64.getEncoder().encodeToString(saltHash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Erro ao hash de senha", e);
        }
    }

    private boolean verifyPassword(String password, String storedHash) {
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
            log.warn("Erro ao verificar senha", e);
            return false;
        }
    }
}
