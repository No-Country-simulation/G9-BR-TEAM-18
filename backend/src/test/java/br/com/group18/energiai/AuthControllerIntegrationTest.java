package br.com.group18.energiai;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

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
}
