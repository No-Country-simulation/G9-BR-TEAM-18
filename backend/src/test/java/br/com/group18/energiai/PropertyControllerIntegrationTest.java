package br.com.group18.energiai;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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
    void shouldCreatePropertyWhenAuthenticated() throws Exception {
        String propertyBody =
                """
            {
                "alias": "Casa de Campo",
                "property_type": "RESIDENCIAL",
                "active": true
            }
            """;

        mockMvc.perform(post("/properties")
                        .cookie(sessionCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(propertyBody))
                .andExpect(status().isCreated());
    }

    @Test
    void shouldReturn401WhenCreatingPropertyWithoutAuth() throws Exception {
        String propertyBody =
                """
            {
                "alias": "Apartamento",
                "property_type": "RESIDENCIAL",
                "active": true
            }
            """;

        mockMvc.perform(post("/properties")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(propertyBody))
                .andExpect(status().isUnauthorized());
    }
}
