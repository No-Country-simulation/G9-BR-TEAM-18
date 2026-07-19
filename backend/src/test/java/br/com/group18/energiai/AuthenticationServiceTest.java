package br.com.group18.energiai;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
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

@ExtendWith(MockitoExtension.class)
class AuthenticationServiceTest {

    @Mock
    private UserRepositoryPort userRepository;

    @InjectMocks
    private AuthenticationService authenticationService;

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
    void shouldReturnEmptyOptionalForIncorrectPasswordOnLogin() {
        User user = new User("Teste", "teste@email.com", "hashInvalidoBase64");
        when(userRepository.findByEmail("teste@email.com")).thenReturn(Optional.of(user));

        Optional<User> result = authenticationService.login("teste@email.com", "senhaErrada");

        assertTrue(result.isEmpty());
    }
}
