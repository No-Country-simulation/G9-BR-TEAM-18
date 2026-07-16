package br.com.group18.energiai;

import br.com.group18.energiai.infrastructure.config.BeanConfiguration;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Import(BeanConfiguration.class)
class AnaliseControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void deveRetornar201ComAnaliseValida() throws Exception {
        String body = """
            {
                "consumoKwh": 200,
                "usoHorarioPico": false,
                "quantidadeEquipamentos": 8,
                "tipoImovel": "Casa",
                "horasAltoConsumo": 4
            }
            """;

        mockMvc.perform(post("/analise-energetica")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.categoria").value("MODERADO"))
                .andExpect(jsonPath("$.probabilidade").isNumber())
                .andExpect(jsonPath("$.recomendacoes").isArray())
                .andExpect(jsonPath("$.custoEstimadoMensal").value(150.0))
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.createdAt").exists());
    }

    @Test
    void deveRetornar400ParaDadosInvalidos() throws Exception {
        String body = """
            {
                "consumoKwh": -10,
                "usoHorarioPico": null,
                "quantidadeEquipamentos": 0,
                "tipoImovel": "",
                "horasAltoConsumo": -1
            }
            """;

        mockMvc.perform(post("/analise-energetica")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.mensagem").value("Erro de validação"))
                .andExpect(jsonPath("$.campos").isMap());
    }

    @Test
    void deveRetornar400ParaBodyVazio() throws Exception {
        mockMvc.perform(post("/analise-energetica")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
                .andExpect(status().isBadRequest());
    }
}
