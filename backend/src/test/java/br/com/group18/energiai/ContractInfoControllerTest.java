package br.com.group18.energiai;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.com.group18.energiai.core.ports.out.MlContractPort;
import br.com.group18.energiai.core.ports.out.TokenBlacklistRepositoryPort;
import br.com.group18.energiai.infrastructure.adapters.in.web.controllers.ContractInfoController;
import br.com.group18.energiai.infrastructure.config.JwtService;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(
        controllers = ContractInfoController.class,
        properties = {"spring.jackson.property-naming-strategy=SNAKE_CASE"})
class ContractInfoControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private MlContractPort registry;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private TokenBlacklistRepositoryPort tokenBlacklistRepository;

    @Test
    void shouldReturnContractInformation() throws Exception {
        when(registry.propertyTypes()).thenReturn(List.of("RESIDENCIAL", "COMERCIAL"));
        when(registry.consumptionCategories()).thenReturn(List.of("BAIXO", "ALTO"));
        when(registry.efficiencyCategories()).thenReturn(List.of("A", "B", "C"));

        mockMvc.perform(get("/contract-info"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.property_types[0]").value("RESIDENCIAL"))
                .andExpect(jsonPath("$.consumption_categories[1]").value("ALTO"))
                .andExpect(jsonPath("$.efficiency_categories[2]").value("C"));
    }
}
