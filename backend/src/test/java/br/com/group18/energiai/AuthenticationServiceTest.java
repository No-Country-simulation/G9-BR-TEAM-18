package br.com.group18.energiai;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import br.com.group18.energiai.application.dto.UserPreferences;
import br.com.group18.energiai.application.exception.EmailAlreadyRegisteredException;
import br.com.group18.energiai.application.exception.ForbiddenOperationException;
import br.com.group18.energiai.application.exception.ResourceNotFoundException;
import br.com.group18.energiai.application.services.AuthenticationService;
import br.com.group18.energiai.core.domain.model.User;
import br.com.group18.energiai.core.ports.out.PasswordHasherPort;
import br.com.group18.energiai.core.ports.out.UserRepositoryPort;
import java.math.BigDecimal;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AuthenticationServiceTest {

    @Mock
    private UserRepositoryPort userRepository;

    @Mock
    private PasswordHasherPort passwordHasher;

    @InjectMocks
    private AuthenticationService authenticationService;

    @Test
    void shouldRegisterWithBCrypt() {
        when(userRepository.findByEmail("novo@email.com")).thenReturn(Optional.empty());
        when(passwordHasher.encode("senha123")).thenReturn("$2a$10$bcryptHash");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId(1L);
            return u;
        });

        User result = authenticationService.register("Nome", "novo@email.com", "senha123");

        assertEquals("Nome", result.getName());
        assertEquals("novo@email.com", result.getEmail());
        assertEquals("$2a$10$bcryptHash", result.getPasswordHash());
        assertFalse(result.isPasswordResetRequired());
    }

    @Test
    void shouldThrowExceptionWhenRegisteringDuplicateEmail() {
        when(userRepository.findByEmail("teste@email.com"))
                .thenReturn(Optional.of(new User("Teste", "teste@email.com", "hash")));

        EmailAlreadyRegisteredException exception = assertThrows(
                EmailAlreadyRegisteredException.class,
                () -> authenticationService.register("Teste 2", "teste@email.com", "senha123"));

        assertEquals("E-mail já cadastrado", exception.getMessage());
    }

    @Test
    void shouldLoginWithBCryptPassword() {
        User user = new User("Nome", "email@email.com", "$2a$10$bcryptHash");
        when(userRepository.findByEmail("email@email.com")).thenReturn(Optional.of(user));
        when(passwordHasher.matches("senhaCorreta", "$2a$10$bcryptHash")).thenReturn(true);

        Optional<User> result = authenticationService.login("email@email.com", "senhaCorreta");

        assertTrue(result.isPresent());
        assertEquals("Nome", result.get().getName());
    }

    @Test
    void shouldReturnEmptyWhenBCryptPasswordDoesNotMatch() {
        User user = new User("Nome", "email@email.com", "$2a$10$bcryptHash");
        when(userRepository.findByEmail("email@email.com")).thenReturn(Optional.of(user));
        when(passwordHasher.matches("senhaErrada", "$2a$10$bcryptHash")).thenReturn(false);

        Optional<User> result = authenticationService.login("email@email.com", "senhaErrada");

        assertTrue(result.isEmpty());
    }

    @Test
    void shouldLoginWithSha256LegacyPassword() {
        User user = new User("Legacy", "legacy@email.com", "c2FsdFNhbHRTYWx0U2FsdFNhbHQ=");
        when(userRepository.findByEmail("legacy@email.com")).thenReturn(Optional.of(user));
        when(passwordHasher.matches("qualquerSenha", "c2FsdFNhbHRTYWx0U2FsdFNhbHQ="))
                .thenReturn(true);

        Optional<User> result = authenticationService.login("legacy@email.com", "qualquerSenha");

        assertTrue(result.isPresent());
    }

    @Test
    void shouldReturnEmptyWhenEmailNotFound() {
        when(userRepository.findByEmail("inexistente@email.com")).thenReturn(Optional.empty());

        Optional<User> result = authenticationService.login("inexistente@email.com", "senha");

        assertTrue(result.isEmpty());
    }

    @Test
    void shouldReturnEmptyWhenStoredHashIsEmpty() {
        User user = new User("Nome", "email@email.com", "");
        when(userRepository.findByEmail("email@email.com")).thenReturn(Optional.of(user));

        Optional<User> result = authenticationService.login("email@email.com", "qualquerSenha");

        assertTrue(result.isEmpty());
    }

    @Test
    void shouldAdminResetPasswordForAnyUser() {
        User user = new User("Nome", "email@email.com", "hashAntigo");
        user.setId(1L);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(passwordHasher.encode("novaSenha")).thenReturn("$2a$10$novoHash");
        when(userRepository.save(user)).thenReturn(user);

        User result = authenticationService.adminResetPassword(1L, "novaSenha");

        assertEquals("$2a$10$novoHash", result.getPasswordHash());
        assertFalse(result.isPasswordResetRequired());
    }

    @Test
    void shouldThrowWhenAdminResetPasswordForNonExistentUser() {
        when(userRepository.findById(7L)).thenReturn(Optional.empty());

        ResourceNotFoundException exception = assertThrows(
                ResourceNotFoundException.class, () -> authenticationService.adminResetPassword(7L, "novaSenha"));

        assertEquals("Usuário não encontrado", exception.getMessage());
    }

    @Test
    void shouldResetPasswordWithBCryptCurrentPassword() {
        User user = new User("Nome", "email@email.com", "$2a$10$oldHash");
        user.setId(1L);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(passwordHasher.matches("currentPass", "$2a$10$oldHash")).thenReturn(true);
        when(passwordHasher.encode("newPass")).thenReturn("$2a$10$newHash");
        when(userRepository.save(user)).thenReturn(user);

        User result = authenticationService.resetPassword(1L, "currentPass", "newPass");

        assertEquals("$2a$10$newHash", result.getPasswordHash());
        assertFalse(result.isPasswordResetRequired());
    }

    @Test
    void shouldThrowWhenResetPasswordWithWrongCurrentPassword() {
        User user = new User("Nome", "email@email.com", "$2a$10$oldHash");
        user.setId(1L);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(passwordHasher.matches("wrongPass", "$2a$10$oldHash")).thenReturn(false);

        ForbiddenOperationException exception = assertThrows(
                ForbiddenOperationException.class,
                () -> authenticationService.resetPassword(1L, "wrongPass", "newPass"));

        assertEquals("Senha atual inválida", exception.getMessage());
    }

    @Test
    void shouldThrowWhenResetPasswordForNonExistentUser() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        ResourceNotFoundException exception = assertThrows(
                ResourceNotFoundException.class, () -> authenticationService.resetPassword(99L, "current", "new"));

        assertEquals("Usuário não encontrado", exception.getMessage());
    }

    @Test
    void shouldReturnUserWhenFindByIdFound() {
        User user = new User("Nome", "email@email.com", "hash");
        user.setId(1L);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        Optional<User> result = authenticationService.findById(1L);

        assertTrue(result.isPresent());
        assertEquals("Nome", result.get().getName());
    }

    @Test
    void shouldReturnEmptyWhenFindByIdNotFound() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        Optional<User> result = authenticationService.findById(99L);

        assertTrue(result.isEmpty());
    }

    @Test
    void shouldUpdatePreferencesWithPeakHourAndHighConsumption() {
        User user = new User("Nome", "email@email.com", "hash");
        user.setId(1L);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserPreferences preferences =
                new UserPreferences(new BigDecimal("300.5"), "mensal", true, new BigDecimal("5.5"));

        User result = authenticationService.updatePreferences(1L, preferences);

        assertEquals(new BigDecimal("300.5"), result.getConsumptionGoal());
        assertEquals("mensal", result.getRegularity());
        assertTrue(result.getPeakHourUsage());
        assertEquals(new BigDecimal("5.5"), result.getHighConsumptionHours());
    }

    @Test
    void shouldKeepUnchangedPreferencesWhenNotInformed() {
        User user = new User("Nome", "email@email.com", "hash");
        user.setId(1L);
        user.setConsumptionGoal(new BigDecimal("250.00"));
        user.setRegularity("semanal");
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserPreferences preferences = new UserPreferences(new BigDecimal("300.5"), null, null, null);

        User result = authenticationService.updatePreferences(1L, preferences);

        assertEquals(new BigDecimal("300.5"), result.getConsumptionGoal());
        assertEquals("semanal", result.getRegularity());
        assertEquals(null, result.getPeakHourUsage());
        assertEquals(null, result.getHighConsumptionHours());
    }

    @Test
    void shouldLoginWithGoogleForNewUser() {
        when(userRepository.findByEmail("novo.google@email.com")).thenReturn(Optional.empty());
        when(passwordHasher.encode(any(String.class))).thenReturn("$2a$10$randomHash");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId(2L);
            return u;
        });

        User result = authenticationService.loginWithGoogle("novo.google@email.com", "Google User");

        assertEquals("Google User", result.getName());
        assertEquals("novo.google@email.com", result.getEmail());
        assertEquals("GOOGLE", result.getAuthProvider());
        assertEquals("$2a$10$randomHash", result.getPasswordHash());
    }

    @Test
    void shouldLoginWithGoogleForExistingUser() {
        User existingUser = new User("Legacy User", "legacy@email.com", "hash");
        existingUser.setId(3L);
        existingUser.setAuthProvider("LOCAL");

        when(userRepository.findByEmail("legacy@email.com")).thenReturn(Optional.of(existingUser));

        User result = authenticationService.loginWithGoogle("legacy@email.com", "Google User");

        assertEquals(3L, result.getId());
        assertEquals("LOCAL", result.getAuthProvider()); // Mantém o provider original
    }

    @Test
    void shouldBlockNormalLoginForGoogleAccounts() {
        User user = new User("Google", "google@email.com", "hash");
        user.setAuthProvider("GOOGLE");
        when(userRepository.findByEmail("google@email.com")).thenReturn(Optional.of(user));

        ForbiddenOperationException exception = assertThrows(
                ForbiddenOperationException.class,
                () -> authenticationService.login("google@email.com", "qualquerSenha"));

        assertEquals(
                "Usuários cadastrados via Google devem utilizar o botão 'Continuar com Google'.",
                exception.getMessage());
    }

    @Test
    void shouldBlockResetPasswordForGoogleAccounts() {
        User user = new User("Google", "google@email.com", "hash");
        user.setId(5L);
        user.setAuthProvider("GOOGLE");
        when(userRepository.findById(5L)).thenReturn(Optional.of(user));

        ForbiddenOperationException exception = assertThrows(
                ForbiddenOperationException.class, () -> authenticationService.resetPassword(5L, "senha", "nova"));

        assertEquals("Usuários cadastrados via Google não podem alterar a senha.", exception.getMessage());
    }
}
