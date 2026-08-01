package br.com.group18.energiai;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.com.group18.energiai.core.ports.out.TokenBlacklistRepositoryPort;
import br.com.group18.energiai.infrastructure.adapters.in.web.controllers.ApplianceController;
import br.com.group18.energiai.infrastructure.client.MlSchemaRegistry;
import br.com.group18.energiai.infrastructure.client.dto.MlApplianceDTO;
import br.com.group18.energiai.infrastructure.config.JwtService;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(ApplianceController.class)
class ApplianceControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private MlSchemaRegistry registry;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private TokenBlacklistRepositoryPort tokenBlacklistRepository;

    @Test
    void deveRetornarCatalogoDeAparelhosDoMlService() throws Exception {
        // Arrange
        List<MlApplianceDTO> mockCatalog =
                List.of(new MlApplianceDTO("Geladeira Frost Free", "REFRIGERATION", (int) 150.0, 24.0));
        when(registry.getApplianceCatalog()).thenReturn(mockCatalog);

        // Act & Assert
        mockMvc.perform(get("/appliances"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Geladeira Frost Free"))
                .andExpect(jsonPath("$[0].ml_category").value("REFRIGERATION"));
    }
}
