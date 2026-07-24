package br.com.group18.energiai;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.com.group18.energiai.infrastructure.client.MlServiceClient;
import com.jayway.jsonpath.JsonPath;
import jakarta.servlet.http.Cookie;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
class DatabasePopulationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private MlServiceClient mlServiceClient;

    @Test
    void shouldPopulateAllTablesSuccessfully() throws Exception {
        String email = "eduardo-" + System.currentTimeMillis() + "@ucb.br";
        String registerBody =
                """
                {
                    "name": "Eduardo",
                    "email": "%s",
                    "password": "SenhaSegura123!"
                }
                """
                        .formatted(email);

        MvcResult authResult = mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerBody))
                .andExpect(status().isCreated())
                .andReturn();

        String setCookieHeader = authResult.getResponse().getHeader("Set-Cookie");
        assertNotNull(setCookieHeader, "O header Set-Cookie não pode ser nulo");
        String tokenValue = setCookieHeader.split(";")[0].replace("SESSION_TOKEN=", "");
        Cookie sessionCookie = new Cookie("SESSION_TOKEN", tokenValue);

        String propertyBody =
                """
                {
                    "alias": "Apartamento UCB",
                    "property_type": "RESIDENCIAL",
                    "active": true
                }
                """;

        MvcResult propertyResult = mockMvc.perform(post("/properties")
                        .cookie(sessionCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(propertyBody))
                .andExpect(status().isCreated())
                .andReturn();

        Integer propertyId = JsonPath.read(propertyResult.getResponse().getContentAsString(), "$.id");

        String applianceBody =
                """
                {
                    "appliance_id": 1,
                    "quantity": 2
                }
                """;

        mockMvc.perform(post("/properties/" + propertyId + "/appliances")
                        .cookie(sessionCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(applianceBody))
                .andExpect(status().isCreated());

        MlServiceClient.MlPredictResponse mockResponse = new MlServiceClient.MlPredictResponse(
                "CRITICO", 0.88, List.of("Troque as lâmpadas por LED", "Desligue a geladeira à noite (brincadeira)"));
        when(mlServiceClient.predict(any())).thenReturn(mockResponse);

        String analysisBody =
                """
                {
                    "property_id": %d,
                    "consumption_kwh": 250.50,
                    "peak_hour_usage": true,
                    "high_consumption_hours": 6.5
                }
                """
                        .formatted(propertyId);

        mockMvc.perform(post("/energy-analysis")
                        .cookie(sessionCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(analysisBody))
                .andExpect(status().isCreated());
    }
}
