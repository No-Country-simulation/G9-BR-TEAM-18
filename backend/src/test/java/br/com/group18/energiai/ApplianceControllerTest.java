package br.com.group18.energiai;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.com.group18.energiai.core.domain.model.Appliance;
import br.com.group18.energiai.core.ports.out.ApplianceRepositoryPort;
import br.com.group18.energiai.core.ports.out.TokenBlacklistRepositoryPort;
import br.com.group18.energiai.infrastructure.adapters.in.web.controllers.ApplianceController;
import br.com.group18.energiai.infrastructure.config.JwtService;
import java.math.BigDecimal;
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
    private ApplianceRepositoryPort applianceRepository;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private TokenBlacklistRepositoryPort tokenBlacklistRepository;

    @Test
    void deveRetornarCatalogoDeAparelhosDoBancoComId() throws Exception {
        Appliance mockAppliance = new Appliance(
                1L, "Geladeira Frost Free", "Refrigeração", new BigDecimal("150.0"), new BigDecimal("24.0"));

        when(applianceRepository.findAll()).thenReturn(List.of(mockAppliance));

        // Act & Assert
        mockMvc.perform(get("/appliances"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].name").value("Geladeira Frost Free"))
                .andExpect(jsonPath("$[0].ml_category").value("REFRIGERATION"));
    }

    @Test
    void naoDeveQuebrarQuandoCategoriaPersistidaNaoForReconhecida() throws Exception {
        Appliance mockAppliance = new Appliance(
                2L, "Aparelho Legado", "Categoria Antiga", new BigDecimal("100.0"), new BigDecimal("5.0"));

        when(applianceRepository.findAll()).thenReturn(List.of(mockAppliance));

        mockMvc.perform(get("/appliances"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].ml_category").value("Categoria Antiga"));
    }
}
