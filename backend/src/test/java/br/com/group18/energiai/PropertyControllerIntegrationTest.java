package br.com.group18.energiai;

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
class PropertyControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    private Cookie sessionCookie;

    @BeforeEach
    void setUp() throws Exception {
        String email = "proptest-" + System.currentTimeMillis() + "@example.com";
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
                .andReturn();

        String setCookie = result.getResponse().getHeader("Set-Cookie");
        if (setCookie != null) {
            String tokenValue = setCookie.split(";")[0].replace("SESSION_TOKEN=", "");
            sessionCookie = new Cookie("SESSION_TOKEN", tokenValue);
        }
    }

    @Test
    void shouldCreateResidentialProperty() throws Exception {
        String body =
                """
            {
                "alias": "Minha Casa",
                "property_type": "RESIDENCIAL"
            }
            """;

        mockMvc.perform(post("/properties")
                        .cookie(sessionCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.property_type").value("RESIDENCIAL"));
    }

    @Test
    void shouldCreateComercialProperty() throws Exception {
        String body =
                """
            {
                "alias": "Meu Escritorio",
                "property_type": "COMERCIAL"
            }
            """;

        mockMvc.perform(post("/properties")
                        .cookie(sessionCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.property_type").value("COMERCIAL"));
    }

    @Test
    void shouldRejectInvalidPropertyType() throws Exception {
        String body =
                """
            {
                "alias": "Teste",
                "property_type": "Casa"
            }
            """;

        mockMvc.perform(post("/properties")
                        .cookie(sessionCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldReturn401WhenCreatingPropertyWithoutAuth() throws Exception {
        String body =
                """
            {
                "alias": "Sem Auth",
                "property_type": "RESIDENCIAL"
            }
            """;

        mockMvc.perform(post("/properties")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isUnauthorized());
    }
}
