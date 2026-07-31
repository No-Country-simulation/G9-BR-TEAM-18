package br.com.group18.energiai;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    private Cookie sessionCookie;
    private Long userId;
    private String email;

    @BeforeEach
    void setUp() throws Exception {
        email = "authtest-" + System.currentTimeMillis() + "@example.com";
        String registerBody =
                """
                {
                    "name": "Test User",
                    "email": "%s",
                    "password": "Senha123!"
                }
                """
                        .formatted(email);

        MvcResult result = mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").exists())
                .andReturn();

        String json = result.getResponse().getContentAsString();
        userId = Long.parseLong(json.split("\"id\":")[1].split(",")[0].trim());

        String setCookie = result.getResponse().getHeader("Set-Cookie");
        if (setCookie != null) {
            String tokenValue = setCookie.split(";")[0].replace("SESSION_TOKEN=", "");
            sessionCookie = new Cookie("SESSION_TOKEN", tokenValue);
        }
    }

    @Test
    void shouldReturn401ForInvalidJwt() throws Exception {
        mockMvc.perform(get("/auth/me").cookie(new Cookie("SESSION_TOKEN", "jwt.invalido.aqui")))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldReturn401WhenLoginFails() throws Exception {
        String loginBody =
                """
            {
                "email": "inexistente@email.com",
                "password": "senhaIncorreta"
            }
            """;

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginBody))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldResetPasswordWithValidCurrentPassword() throws Exception {
        String resetBody =
                """
            {
                "current_password": "Senha123!",
                "new_password": "NovaSenha456!"
            }
            """;

        mockMvc.perform(post("/auth/reset-password")
                        .cookie(sessionCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(resetBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.password_reset_required").value(false));
    }

    @Test
    void shouldFailResetPasswordWithWrongCurrentPassword() throws Exception {
        String resetBody =
                """
            {
                "current_password": "SenhaErrada",
                "new_password": "NovaSenha456!"
            }
            """;

        mockMvc.perform(post("/auth/reset-password")
                        .cookie(sessionCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(resetBody))
                .andExpect(status().isForbidden());
    }

    @Test
    void shouldLoginWithNewPasswordAfterReset() throws Exception {
        // Reset password
        String resetBody =
                """
            {
                "current_password": "Senha123!",
                "new_password": "NovaSenha456!"
            }
            """;

        mockMvc.perform(post("/auth/reset-password")
                        .cookie(sessionCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(resetBody))
                .andExpect(status().isOk());

        // Login with new password
        String loginBody =
                """
            {
                "email": "%s",
                "password": "NovaSenha456!"
            }
            """
                        .formatted(email);

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginBody))
                .andExpect(status().isOk());
    }

    @Test
    void shouldAdminResetPassword() throws Exception {
        String adminResetBody =
                """
            {
                "new_password": "AdminReset123!"
            }
            """;

        mockMvc.perform(post("/auth/admin/reset-password/" + userId)
                        .cookie(sessionCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(adminResetBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.password_reset_required").value(false));

        // Login with admin-reset password
        String loginBody =
                """
            {
                "email": "%s",
                "password": "AdminReset123!"
            }
            """
                        .formatted(email);

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginBody))
                .andExpect(status().isOk());
    }

    @Test
    void shouldReturnNotFoundForNonExistentUserAdminReset() throws Exception {
        String body = """
            {
                "new_password": "Teste123!"
            }
            """;

        mockMvc.perform(post("/auth/admin/reset-password/99999")
                        .cookie(sessionCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isNotFound());
    }
}
