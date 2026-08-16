package br.com.group18.energiai.application.services;

import br.com.group18.energiai.application.dto.UserPreferences;
import br.com.group18.energiai.application.exception.EmailAlreadyRegisteredException;
import br.com.group18.energiai.application.exception.ForbiddenOperationException;
import br.com.group18.energiai.application.exception.ResourceNotFoundException;
import br.com.group18.energiai.core.domain.model.User;
import br.com.group18.energiai.core.ports.out.PasswordHasherPort;
import br.com.group18.energiai.core.ports.out.UserRepositoryPort;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class AuthenticationService {

    private static final Logger log = LoggerFactory.getLogger(AuthenticationService.class);

    private final UserRepositoryPort userRepository;
    private final PasswordHasherPort passwordHasher;

    public AuthenticationService(UserRepositoryPort userRepository, PasswordHasherPort passwordHasher) {
        this.userRepository = userRepository;
        this.passwordHasher = passwordHasher;
    }

    public User register(String name, String email, String password) {
        if (userRepository.findByEmail(email).isPresent()) {
            throw new EmailAlreadyRegisteredException("E-mail já cadastrado");
        }
        return userRepository.save(new User(name, email, passwordHasher.encode(password)));
    }

    public Optional<User> login(String email, String password) {
        Optional<User> user = userRepository.findByEmail(email);
        if (user.isEmpty()) {
            return Optional.empty();
        }
        if ("GOOGLE".equals(user.get().getAuthProvider())) {
            throw new ForbiddenOperationException(
                    "Usuários cadastrados via Google devem utilizar o botão 'Continuar com Google'.");
        }
        String storedHash = user.get().getPasswordHash();
        if (storedHash == null || storedHash.isEmpty()) {
            return Optional.empty();
        }
        if (!passwordHasher.matches(password, storedHash)) {
            return Optional.empty();
        }
        return user;
    }

    public User loginWithGoogle(String email, String name) {
        return userRepository.findByEmail(email).orElseGet(() -> {
            byte[] randomBytes = new byte[32];
            new java.security.SecureRandom().nextBytes(randomBytes);
            String secureRandomPassword = java.util.Base64.getEncoder().encodeToString(randomBytes);

            User newUser = new User(name, email, passwordHasher.encode(secureRandomPassword));
            newUser.setAuthProvider("GOOGLE");
            return userRepository.save(newUser);
        });
    }

    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    public User resetPassword(Long userId, String currentPassword, String newPassword) {
        User user = requireUser(userId);

        if ("GOOGLE".equals(user.getAuthProvider())) {
            throw new ForbiddenOperationException("Usuários cadastrados via Google não podem alterar a senha.");
        }

        boolean currentValid = passwordHasher.matches(currentPassword, user.getPasswordHash());
        log.info("resetPassword userId={}: currentValid={}", userId, currentValid);
        if (!currentValid) {
            throw new ForbiddenOperationException("Senha atual inválida");
        }

        user.setPasswordHash(passwordHasher.encode(newPassword));
        user.setPasswordResetRequired(false);
        return userRepository.save(user);
    }

    public User adminResetPassword(Long userId, String newPassword) {
        User user = requireUser(userId);
        user.setPasswordHash(passwordHasher.encode(newPassword));
        user.setPasswordResetRequired(false);
        return userRepository.save(user);
    }

    public User updatePreferences(Long userId, UserPreferences preferences) {
        User user = requireUser(userId);
        if (preferences.consumptionGoal() != null) {
            user.setConsumptionGoal(preferences.consumptionGoal());
        }
        if (preferences.regularity() != null) {
            user.setRegularity(preferences.regularity());
        }
        if (preferences.peakHourUsage() != null) {
            user.setPeakHourUsage(preferences.peakHourUsage());
        }
        if (preferences.highConsumptionHours() != null) {
            user.setHighConsumptionHours(preferences.highConsumptionHours());
        }
        return userRepository.save(user);
    }

    private User requireUser(Long userId) {
        return userRepository
                .findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));
    }
}
