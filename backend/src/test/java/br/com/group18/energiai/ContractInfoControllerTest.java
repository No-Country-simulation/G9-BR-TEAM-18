package br.com.group18.energiai;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.com.group18.energiai.core.ports.out.TokenBlacklistRepositoryPort;
import br.com.group18.energiai.infrastructure.adapters.in.web.controllers.ContractInfoController;
import br.com.group18.energiai.infrastructure.client.MlSchemaRegistry;
import br.com.group18.energiai.infrastructure.config.JwtService;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(ContractInfoController.class)
class ContractInfoControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private MlSchemaRegistry registry;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private TokenBlacklistRepositoryPort tokenBlacklistRepository;

    @Test
    void deveRetornarInformacoesDoContrato() throws Exception {
        // Arrange: Mockando o que está na memória do Registry
        when(registry.getPropertyTypes()).thenReturn(List.of("RESIDENCIAL", "COMERCIAL"));
        when(registry.getConsumptionCategories()).thenReturn(List.of("BAIXO", "ALTO"));
        when(registry.getEfficiencyCategories()).thenReturn(List.of("A", "B", "C"));

        // Act & Assert: Chamando a API e validando o JSON de retorno
        mockMvc.perform(get("/contract-info"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.property_types[0]").value("RESIDENCIAL"))
                .andExpect(jsonPath("$.consumption_categories[1]").value("ALTO"))
                .andExpect(jsonPath("$.efficiency_categories[2]").value("C"));
    }
}
