package br.com.group18.energiai;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import br.com.group18.energiai.infrastructure.config.BeanConfiguration;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@Import(BeanConfiguration.class)
class AnalysisControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void shouldReturn201WithValidAnalysis() throws Exception {
        String body =
                """
            {
                "consumption_kwh": 200,
                "peak_hour_usage": false,
                "equipment_quantity": 8,
                "property_type": "Casa",
                "high_consumption_hours": 4
            }
            """;

        mockMvc.perform(post("/energy-analysis")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.category").value("BOM"))
                .andExpect(jsonPath("$.probability").isNumber())
                .andExpect(jsonPath("$.recommendations").isArray())
                .andExpect(jsonPath("$.estimated_monthly_cost").value(150.0))
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.created_at").exists());
    }

    @Test
    void shouldReturn400ForInvalidData() throws Exception {
        String body =
                """
            {
                "consumptionKwh": -10,
                "peakHourUsage": null,
                "equipmentQuantity": 0,
                "propertyType": "",
                "highConsumptionHours": -1
            }
            """;

        mockMvc.perform(post("/energy-analysis")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Erro de validação"))
                .andExpect(jsonPath("$.fields").isMap());
    }

    @Test
    void shouldReturn400ForEmptyBody() throws Exception {
        mockMvc.perform(post("/energy-analysis")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }
}
