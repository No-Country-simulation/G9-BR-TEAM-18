package br.com.group18.energiai;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.com.group18.energiai.application.dto.UserPreferences;
import br.com.group18.energiai.application.exception.EmailAlreadyRegisteredException;
import br.com.group18.energiai.application.exception.ResourceNotFoundException;
import br.com.group18.energiai.application.services.AuthenticationService;
import br.com.group18.energiai.core.domain.model.User;
import br.com.group18.energiai.core.ports.out.TokenBlacklistRepositoryPort;
import br.com.group18.energiai.infrastructure.adapters.in.web.controllers.AuthController;
import br.com.group18.energiai.infrastructure.config.JwtService;
import jakarta.servlet.http.Cookie;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(
        controllers = AuthController.class,
        properties = {
            "spring.jackson.property-naming-strategy=SNAKE_CASE",
            "SESSION_MAX_AGE_SECONDS=3600",
            "SESSION_SECURE=false"
        })
class AuthControllerTest {

    private static final String TOKEN = "fake.jwt.token";
    private static final String TOKEN_HASH = "hashed-token";

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AuthenticationService authenticationService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private TokenBlacklistRepositoryPort tokenBlacklistRepository;

    private void mockAuthenticatedSession(Long userId) {
        when(jwtService.hashToken(TOKEN)).thenReturn(TOKEN_HASH);
        when(tokenBlacklistRepository.existsByTokenHash(TOKEN_HASH)).thenReturn(false);
        when(jwtService.validateAndGetUserId(TOKEN)).thenReturn(userId);
    }

    private User userWithPreferences(Long id) {
        User user = new User("Usuario Teste", "user" + id + "@example.com", "hash");
        user.setId(id);
        user.setConsumptionGoal(new BigDecimal("250.00"));
        user.setRegularity("semanal");
        user.setPeakHourUsage(true);
        user.setHighConsumptionHours(new BigDecimal("4.5"));
        return user;
    }

    @Test
    void shouldRegisterUserSuccessfully() throws Exception {
        User created = new User("Novo Usuario", "novo@example.com", "hashedPass");
        created.setId(1L);
        when(authenticationService.register("Novo Usuario", "novo@example.com", "senha123"))
                .thenReturn(created);
        when(jwtService.createToken(1L)).thenReturn(TOKEN);

        String body =
                """
                {
                    "name": "Novo Usuario",
                    "email": "novo@example.com",
                    "password": "senha123"
                }
                """;

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.email").value("novo@example.com"))
                .andExpect(jsonPath("$.token").value(TOKEN));
    }

    @Test
    void shouldReturn409WhenEmailAlreadyRegistered() throws Exception {
        when(authenticationService.register("Novo Usuario", "duplicado@example.com", "senha123"))
                .thenThrow(new EmailAlreadyRegisteredException("E-mail já cadastrado"));

        String body =
                """
                {
                    "name": "Novo Usuario",
                    "email": "duplicado@example.com",
                    "password": "senha123"
                }
                """;

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("E-mail já cadastrado"));
    }

    @Test
    void shouldLoginAndReturnPeakHourUsageAndHighConsumptionHours() throws Exception {
        User user = userWithPreferences(1L);
        when(authenticationService.login("user1@example.com", "senha123")).thenReturn(Optional.of(user));
        when(jwtService.createToken(1L)).thenReturn(TOKEN);

        String body =
                """
                {
                    "email": "user1@example.com",
                    "password": "senha123"
                }
                """;

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value(TOKEN))
                .andExpect(jsonPath("$.peak_hour_usage").value(true))
                .andExpect(jsonPath("$.high_consumption_hours").value(4.5));
    }

    @Test
    void shouldReturn401WhenLoginFails() throws Exception {
        when(authenticationService.login("user1@example.com", "senhaErrada")).thenReturn(Optional.empty());

        String body =
                """
                {
                    "email": "user1@example.com",
                    "password": "senhaErrada"
                }
                """;

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldReturn401OnMeWithoutSessionCookie() throws Exception {
        mockMvc.perform(get("/auth/me")).andExpect(status().isUnauthorized());
    }

    @Test
    void shouldReturn401OnMeWithInvalidToken() throws Exception {
        when(jwtService.hashToken("token.invalido")).thenReturn("hash-invalido");
        when(tokenBlacklistRepository.existsByTokenHash("hash-invalido")).thenReturn(false);
        when(jwtService.validateAndGetUserId("token.invalido")).thenReturn(null);

        mockMvc.perform(get("/auth/me").cookie(new Cookie("SESSION_TOKEN", "token.invalido")))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldReturnPeakHourUsageAndHighConsumptionHoursOnMe() throws Exception {
        mockAuthenticatedSession(1L);
        when(authenticationService.findById(1L)).thenReturn(Optional.of(userWithPreferences(1L)));

        mockMvc.perform(get("/auth/me").cookie(new Cookie("SESSION_TOKEN", TOKEN)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.consumption_goal").value(250.00))
                .andExpect(jsonPath("$.regularity").value("semanal"))
                .andExpect(jsonPath("$.peak_hour_usage").value(true))
                .andExpect(jsonPath("$.high_consumption_hours").value(4.5));
    }

    @Test
    void shouldDistinguishFalsePeakHourUsageFromAbsent() throws Exception {
        mockAuthenticatedSession(2L);
        User user = new User("Nome", "user2@example.com", "hash");
        user.setId(2L);
        user.setPeakHourUsage(false);
        when(authenticationService.findById(2L)).thenReturn(Optional.of(user));

        mockMvc.perform(get("/auth/me").cookie(new Cookie("SESSION_TOKEN", TOKEN)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.peak_hour_usage").value(false));
    }

    @Test
    void shouldReturn401WhenUpdatingPreferencesWithoutSession() throws Exception {
        String body =
                """
                {
                    "peak_hour_usage": true
                }
                """;

        mockMvc.perform(put("/auth/preferences")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldUpdatePeakHourUsageAndHighConsumptionHours() throws Exception {
        mockAuthenticatedSession(1L);
        when(authenticationService.updatePreferences(eq(1L), any(UserPreferences.class)))
                .thenReturn(userWithPreferences(1L));

        String body =
                """
                {
                    "consumption_goal": 250.0,
                    "regularity": "semanal",
                    "peak_hour_usage": true,
                    "high_consumption_hours": 4.5
                }
                """;

        mockMvc.perform(put("/auth/preferences")
                        .cookie(new Cookie("SESSION_TOKEN", TOKEN))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.peak_hour_usage").value(true))
                .andExpect(jsonPath("$.high_consumption_hours").value(4.5));
    }

    @Test
    void shouldSendPeakHourUsageAsBooleanAndHighConsumptionHoursAsNumberToService() throws Exception {
        mockAuthenticatedSession(1L);
        when(authenticationService.updatePreferences(eq(1L), any(UserPreferences.class)))
                .thenReturn(userWithPreferences(1L));

        String body =
                """
                {
                    "peak_hour_usage": true,
                    "high_consumption_hours": 4.5
                }
                """;

        mockMvc.perform(put("/auth/preferences")
                        .cookie(new Cookie("SESSION_TOKEN", TOKEN))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk());

        ArgumentCaptor<UserPreferences> captor = ArgumentCaptor.forClass(UserPreferences.class);
        verify(authenticationService).updatePreferences(eq(1L), captor.capture());

        UserPreferences sentPreferences = captor.getValue();
        assertInstanceOf(Boolean.class, sentPreferences.peakHourUsage());
        assertEquals(Boolean.TRUE, sentPreferences.peakHourUsage());
        assertInstanceOf(Number.class, sentPreferences.highConsumptionHours());
    }

    @Test
    void shouldLogoutWhenAuthenticated() throws Exception {
        when(jwtService.getExpiration(TOKEN)).thenReturn(new Date());
        when(jwtService.hashToken(TOKEN)).thenReturn(TOKEN_HASH);

        mockMvc.perform(post("/auth/logout").cookie(new Cookie("SESSION_TOKEN", TOKEN)))
                .andExpect(status().isOk());

        verify(tokenBlacklistRepository).save(eq(TOKEN_HASH), any(LocalDateTime.class));
    }

    @Test
    void shouldLogoutWithoutToken() throws Exception {
        mockMvc.perform(post("/auth/logout")).andExpect(status().isOk());
    }

    @Test
    void shouldResetOwnPasswordWhenAuthenticated() throws Exception {
        mockAuthenticatedSession(1L);
        when(authenticationService.resetPassword(1L, "senhaAtual", "novaSenha")).thenReturn(userWithPreferences(1L));
        when(jwtService.createToken(1L)).thenReturn(TOKEN);

        String body =
                """
                {
                    "current_password": "senhaAtual",
                    "new_password": "novaSenha"
                }
                """;

        mockMvc.perform(post("/auth/reset-password")
                        .cookie(new Cookie("SESSION_TOKEN", TOKEN))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("user1@example.com"));
    }

    @Test
    void shouldReturn401WhenResettingPasswordWithoutSession() throws Exception {
        String body =
                """
                {
                    "current_password": "senhaAtual",
                    "new_password": "novaSenha"
                }
                """;

        mockMvc.perform(post("/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldAdminResetPasswordWhenCalled() throws Exception {
        when(authenticationService.adminResetPassword(1L, "novaSenha")).thenReturn(userWithPreferences(1L));
        when(jwtService.createToken(1L)).thenReturn(TOKEN);

        String body =
                """
                {
                    "new_password": "novaSenha"
                }
                """;

        mockMvc.perform(post("/auth/admin/reset-password/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("user1@example.com"));
    }

    @Test
    void shouldReturn404WhenUpdatingPreferencesForNonExistentUser() throws Exception {
        mockAuthenticatedSession(1L);
        when(authenticationService.updatePreferences(eq(1L), any(UserPreferences.class)))
                .thenThrow(new ResourceNotFoundException("Usuário não encontrado"));

        String body =
                """
                {
                    "peak_hour_usage": true
                }
                """;

        mockMvc.perform(put("/auth/preferences")
                        .cookie(new Cookie("SESSION_TOKEN", TOKEN))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Usuário não encontrado"));
    }
}
