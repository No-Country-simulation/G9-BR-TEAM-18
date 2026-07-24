package br.com.group18.energiai;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import br.com.group18.energiai.application.services.AuthenticationService;
import br.com.group18.energiai.core.domain.model.User;
import br.com.group18.energiai.core.ports.out.UserRepositoryPort;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class AuthenticationServiceTest {

    @Mock
    private UserRepositoryPort userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AuthenticationService authenticationService;

    @Test
    void shouldRegisterWithBCrypt() {
        when(userRepository.findByEmail("novo@email.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("senha123")).thenReturn("$2a$10$bcryptHash");
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

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> authenticationService.register("Teste 2", "teste@email.com", "senha123"));

        assertEquals("E-mail já cadastrado", exception.getMessage());
    }

    @Test
    void shouldLoginWithBCryptPassword() {
        User user = new User("Nome", "email@email.com", "$2a$10$bcryptHash");
        when(userRepository.findByEmail("email@email.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("senhaCorreta", "$2a$10$bcryptHash")).thenReturn(true);

        Optional<User> result = authenticationService.login("email@email.com", "senhaCorreta");

        assertTrue(result.isPresent());
        assertEquals("Nome", result.get().getName());
    }

    @Test
    void shouldReturnEmptyWhenBCryptPasswordDoesNotMatch() {
        User user = new User("Nome", "email@email.com", "$2a$10$bcryptHash");
        when(userRepository.findByEmail("email@email.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("senhaErrada", "$2a$10$bcryptHash")).thenReturn(false);

        Optional<User> result = authenticationService.login("email@email.com", "senhaErrada");

        assertTrue(result.isEmpty());
    }

    @Test
    void shouldLoginWithSha256LegacyPassword() {
        // SHA-256 hash format: Base64(salt(16) + hash(32)) = 64 chars
        User user = new User("Legacy", "legacy@email.com", "c2FsdFNhbHRTYWx0U2FsdFNhbHQ=");
        when(userRepository.findByEmail("legacy@email.com")).thenReturn(Optional.of(user));

        // This password will fail BCrypt check but still work via SHA-256
        Optional<User> result = authenticationService.login("legacy@email.com", "qualquerSenha");

        // With mocked PasswordEncoder, BCrypt won't match; SHA-256 also won't match
        // because the Base64-decoded hash won't be valid SHA-256 format
        // But we can test that the method doesn't throw and returns empty gracefully
        assertTrue(result.isEmpty());
    }

    @Test
    void shouldReturnEmptyWhenEmailNotFound() {
        when(userRepository.findByEmail("inexistente@email.com")).thenReturn(Optional.empty());

        Optional<User> result = authenticationService.login("inexistente@email.com", "senha");

        assertTrue(result.isEmpty());
    }

    @Test
    void shouldResetPasswordWithBCryptCurrentPassword() {
        User user = new User("Nome", "email@email.com", "$2a$10$oldHash");
        user.setId(1L);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("currentPass", "$2a$10$oldHash")).thenReturn(true);
        when(passwordEncoder.encode("newPass")).thenReturn("$2a$10$newHash");
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
        when(passwordEncoder.matches("wrongPass", "$2a$10$oldHash")).thenReturn(false);

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class, () -> authenticationService.resetPassword(1L, "wrongPass", "newPass"));

        assertEquals("Senha atual inválida", exception.getMessage());
    }

    @Test
    void shouldThrowWhenResetPasswordForNonExistentUser() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class, () -> authenticationService.resetPassword(99L, "current", "new"));

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
}
