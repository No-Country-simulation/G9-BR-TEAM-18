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
class AnalysisControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    private Cookie sessionCookie;

    @BeforeEach
    void setUp() throws Exception {
        String registerBody =
                """
                {
                    "name": "Test User",
                    "email": "test-%d@example.com",
                    "password": "Senha123!"
                }
                """
                        .formatted(System.currentTimeMillis());

        MvcResult result = mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerBody))
                .andExpect(status().isCreated())
                .andReturn();

        String setCookie = result.getResponse().getHeader("Set-Cookie");
        if (setCookie != null) {
            String tokenValue = setCookie.split(";")[0].replace("SESSION_TOKEN=", "");
            sessionCookie = new Cookie("SESSION_TOKEN", tokenValue);
        }
    }

    @Test
    void shouldReturn400ForInvalidData() throws Exception {
        String body =
                """
            {
                "propertyId": -1,
                "property_id": -1,
                "consumptionKwh": 200.0,
                "consumption_kwh": 200.0,
                "peakHourUsage": false,
                "peak_hour_usage": false,
                "highConsumptionHours": 4.0,
                "high_consumption_hours": 4.0
            }
            """;

        mockMvc.perform(post("/energy-analysis")
                        .cookie(sessionCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldReturn401WhenNotAuthenticated() throws Exception {
        String body =
                """
            {
                "propertyId": 1,
                "property_id": 1,
                "consumptionKwh": 200.0,
                "consumption_kwh": 200.0,
                "peakHourUsage": false,
                "peak_hour_usage": false,
                "highConsumptionHours": 4.0,
                "high_consumption_hours": 4.0
            }
            """;

        mockMvc.perform(post("/energy-analysis")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isUnauthorized());
    }
}
