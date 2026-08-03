package br.com.group18.energiai;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.com.group18.energiai.application.services.AuthenticationService;
import br.com.group18.energiai.core.domain.model.User;
import br.com.group18.energiai.core.ports.out.TokenBlacklistRepositoryPort;
import br.com.group18.energiai.infrastructure.adapters.in.web.controllers.AuthController;
import br.com.group18.energiai.infrastructure.config.JwtService;
import jakarta.servlet.http.Cookie;
import java.math.BigDecimal;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Teste de unidade do AuthController via @WebMvcTest.
 *
 * <p>Substitui o antigo AuthControllerIntegrationTest (@SpringBootTest), que subia o contexto
 * completo da aplicação e exigia conexão real com o Oracle e variáveis de ambiente
 * (SPRING_DATASOURCE_URL, JWT_SECRET, SESSION_MAX_AGE_SECONDS etc). Aqui apenas o AuthController
 * é carregado; AuthenticationService, JwtService e TokenBlacklistRepositoryPort são mockados com
 * @MockitoBean, então o teste roda sem banco e sem depender de nada do ambiente local, validando
 * apenas o contrato HTTP das rotas /auth/register, /auth/login, /auth/me e /auth/preferences.
 */
@WebMvcTest(
        controllers = AuthController.class,
        properties = {"SESSION_MAX_AGE_SECONDS=3600", "SESSION_SECURE=false"})
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

    private void mockUsuarioAutenticado(Long userId) {
        when(jwtService.hashToken(TOKEN)).thenReturn(TOKEN_HASH);
        when(tokenBlacklistRepository.existsByTokenHash(TOKEN_HASH)).thenReturn(false);
        when(jwtService.validateAndGetUserId(TOKEN)).thenReturn(userId);
    }

    private User usuarioComPreferencias(Long id) {
        User user = new User("Usuario Teste", "user" + id + "@example.com", "hash");
        user.setId(id);
        user.setConsumptionGoal(new BigDecimal("250.00"));
        user.setRegularity("semanal");
        user.setPeakHourUsage(true);
        user.setHighConsumptionHours(new BigDecimal("4.5"));
        return user;
    }

    // ---------- POST /auth/register ----------

    @Test
    void deveRegistrarUsuarioComSucesso() throws Exception {
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
    void deveRetornar409QuandoEmailJaCadastrado() throws Exception {
        when(authenticationService.register("Novo Usuario", "duplicado@example.com", "senha123"))
                .thenThrow(new IllegalArgumentException("E-mail já cadastrado"));

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

    // ---------- POST /auth/login ----------

    @Test
    void deveLogarERetornarPeakHourUsageEHighConsumptionHours() throws Exception {
        User user = usuarioComPreferencias(1L);
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
    void deveRetornar401QuandoLoginFalha() throws Exception {
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

    // ---------- GET /auth/me ----------

    @Test
    void deveRetornar401NoMeSemCookieDeSessao() throws Exception {
        mockMvc.perform(get("/auth/me")).andExpect(status().isUnauthorized());
    }

    @Test
    void deveRetornar401NoMeComTokenInvalido() throws Exception {
        when(jwtService.hashToken("token.invalido")).thenReturn("hash-invalido");
        when(tokenBlacklistRepository.existsByTokenHash("hash-invalido")).thenReturn(false);
        when(jwtService.validateAndGetUserId("token.invalido")).thenReturn(null);

        mockMvc.perform(get("/auth/me").cookie(new Cookie("SESSION_TOKEN", "token.invalido")))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void deveRetornarPeakHourUsageEHighConsumptionHoursNoMe() throws Exception {
        mockUsuarioAutenticado(1L);
        when(authenticationService.findById(1L)).thenReturn(Optional.of(usuarioComPreferencias(1L)));

        mockMvc.perform(get("/auth/me").cookie(new Cookie("SESSION_TOKEN", TOKEN)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.consumption_goal").value(250.00))
                .andExpect(jsonPath("$.regularity").value("semanal"))
                .andExpect(jsonPath("$.peak_hour_usage").value(true))
                .andExpect(jsonPath("$.high_consumption_hours").value(4.5));
    }

    @Test
    void deveDistinguirPeakHourUsageFalseDeAusente() throws Exception {
        mockUsuarioAutenticado(2L);
        User user = new User("Nome", "user2@example.com", "hash");
        user.setId(2L);
        user.setPeakHourUsage(false);
        when(authenticationService.findById(2L)).thenReturn(Optional.of(user));

        mockMvc.perform(get("/auth/me").cookie(new Cookie("SESSION_TOKEN", TOKEN)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.peak_hour_usage").value(false));
    }

    // ---------- PUT /auth/preferences ----------

    @Test
    void deveRetornar401AoAtualizarPreferenciasSemSessao() throws Exception {
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
    void deveAtualizarPeakHourUsageEHighConsumptionHours() throws Exception {
        mockUsuarioAutenticado(1L);
        when(authenticationService.updatePreferences(eq(1L), anyMap())).thenReturn(usuarioComPreferencias(1L));

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
    void deveEnviarPeakHourUsageComoBooleanEHighConsumptionHoursComoNumberParaOServico() throws Exception {
        mockUsuarioAutenticado(1L);
        when(authenticationService.updatePreferences(eq(1L), anyMap())).thenReturn(usuarioComPreferencias(1L));

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

        @SuppressWarnings("unchecked")
        ArgumentCaptor<Map<String, Object>> captor = ArgumentCaptor.forClass(Map.class);
        verify(authenticationService).updatePreferences(eq(1L), captor.capture());

        Map<String, Object> preferenciasEnviadas = captor.getValue();
        assertInstanceOf(Boolean.class, preferenciasEnviadas.get("peak_hour_usage"));
        assertEquals(Boolean.TRUE, preferenciasEnviadas.get("peak_hour_usage"));
        assertInstanceOf(Number.class, preferenciasEnviadas.get("high_consumption_hours"));
    }

    @Test
    void deveRetornar400QuandoAtualizarPreferenciasComUsuarioInexistente() throws Exception {
        mockUsuarioAutenticado(1L);
        when(authenticationService.updatePreferences(eq(1L), anyMap()))
                .thenThrow(new IllegalArgumentException("Usuário não encontrado"));

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
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Usuário não encontrado"));
    }
}
