package br.com.group18.energiai;

import static org.hamcrest.Matchers.endsWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.com.group18.energiai.application.dto.DashboardData;
import br.com.group18.energiai.application.dto.EnergySimulationResult;
import br.com.group18.energiai.application.dto.MonthlyConsumption;
import br.com.group18.energiai.application.exception.ForbiddenOperationException;
import br.com.group18.energiai.application.exception.InvalidRequestException;
import br.com.group18.energiai.application.exception.MlServiceUnavailableException;
import br.com.group18.energiai.application.exception.ResourceNotFoundException;
import br.com.group18.energiai.application.services.DashboardService;
import br.com.group18.energiai.application.services.EnergyAnalysisService;
import br.com.group18.energiai.application.services.PropertyService;
import br.com.group18.energiai.core.domain.model.EnergyAnalysis;
import br.com.group18.energiai.core.domain.model.Property;
import br.com.group18.energiai.core.domain.valueobject.EfficiencyCategory;
import br.com.group18.energiai.core.ports.out.AnalysisRepositoryPort;
import br.com.group18.energiai.core.ports.out.MlContractPort;
import br.com.group18.energiai.core.ports.out.TokenBlacklistRepositoryPort;
import br.com.group18.energiai.infrastructure.adapters.in.web.controllers.AnalysisController;
import br.com.group18.energiai.infrastructure.config.JwtService;
import jakarta.servlet.http.Cookie;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(
        controllers = AnalysisController.class,
        properties = {
            "spring.jackson.property-naming-strategy=SNAKE_CASE",
            "SESSION_MAX_AGE_SECONDS=3600",
            "SESSION_SECURE=false"
        })
class AnalysisControllerTest {

    private static final String SESSION_TOKEN = "valid.session.token";
    private static final String TOKEN_HASH = "hash-of-valid-token";
    private static final String VALID_BODY =
            """
            {
                "property_id": 10,
                "consumption_kwh": 108.0,
                "peak_hour_usage": true,
                "high_consumption_hours": 6.5
            }
            """;

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private EnergyAnalysisService energyAnalysisService;

    @MockitoBean
    private AnalysisRepositoryPort analysisRepository;

    @MockitoBean
    private PropertyService propertyService;

    @MockitoBean
    private MlContractPort mlContract;

    @MockitoBean
    private DashboardService dashboardService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private TokenBlacklistRepositoryPort tokenBlacklistRepository;

    private Cookie sessionCookie() {
        return new Cookie("SESSION_TOKEN", SESSION_TOKEN);
    }

    private void mockAuthenticatedSession(Long userId) {
        when(jwtService.hashToken(SESSION_TOKEN)).thenReturn(TOKEN_HASH);
        when(tokenBlacklistRepository.existsByTokenHash(TOKEN_HASH)).thenReturn(false);
        when(jwtService.validateAndGetUserId(SESSION_TOKEN)).thenReturn(userId);
    }

    private Property ownedProperty() {
        Property property = new Property(1L, "Minha Casa", "RESIDENCIAL");
        property.setId(10L);
        return property;
    }

    private EnergyAnalysis completedAnalysis() {
        EnergyAnalysis analysis = new EnergyAnalysis(10L, new BigDecimal("108.00"), true, new BigDecimal("6.50"));
        analysis.setId(100L);
        analysis.setPropertyType("RESIDENCIAL");
        analysis.setCategory(new EfficiencyCategory("EXCELENTE"));
        analysis.setProbability(new BigDecimal("0.95"));
        analysis.setStatus("CONCLUIDA");
        analysis.setSource("model");
        analysis.setRecommendations(List.of("Ótimo consumo."));
        analysis.setEstimatedMonthlyCost(new BigDecimal("81.00"));
        return analysis;
    }

    @Test
    void shouldReturn401WhenAnalyzingWithoutSession() throws Exception {
        mockMvc.perform(post("/energy-analysis")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_BODY))
                .andExpect(status().isUnauthorized());

        verify(energyAnalysisService, never()).execute(any(), anyList(), any(), any(), any(), any());
    }

    @Test
    void shouldCreateAnalysisWhenAuthenticated() throws Exception {
        mockAuthenticatedSession(1L);
        when(propertyService.getOwned(10L, 1L)).thenReturn(ownedProperty());
        when(propertyService.listAppliances(10L, 1L)).thenReturn(List.of());
        when(energyAnalysisService.execute(
                        any(Property.class),
                        anyList(),
                        any(BigDecimal.class),
                        any(Boolean.class),
                        any(BigDecimal.class),
                        any()))
                .thenReturn(completedAnalysis());

        mockMvc.perform(post("/energy-analysis")
                        .cookie(sessionCookie())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_BODY))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(100))
                .andExpect(jsonPath("$.property_id").value(10))
                .andExpect(jsonPath("$.consumption_kwh").value(108.00))
                .andExpect(jsonPath("$.category").value("EXCELENTE"))
                .andExpect(jsonPath("$.status").value("CONCLUIDA"))
                .andExpect(jsonPath("$.source").value("model"))
                .andExpect(jsonPath("$.estimated_monthly_cost").value(81.00));
    }

    @Test
    void shouldReturn400WhenRequestValidationFails() throws Exception {
        mockAuthenticatedSession(1L);

        String invalidBody =
                """
                {
                    "property_id": -1,
                    "consumption_kwh": 200.0,
                    "peak_hour_usage": false,
                    "high_consumption_hours": 4.0
                }
                """;

        mockMvc.perform(post("/energy-analysis")
                        .cookie(sessionCookie())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidBody))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldReturn404WhenPropertyDoesNotExist() throws Exception {
        mockAuthenticatedSession(1L);
        when(propertyService.getOwned(10L, 1L)).thenThrow(new ResourceNotFoundException("Propriedade não encontrada"));

        mockMvc.perform(post("/energy-analysis")
                        .cookie(sessionCookie())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_BODY))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Propriedade não encontrada"));
    }

    @Test
    void shouldReturn503WhenMlServiceIsUnavailable() throws Exception {
        mockAuthenticatedSession(1L);
        when(propertyService.getOwned(10L, 1L)).thenReturn(ownedProperty());
        when(propertyService.listAppliances(10L, 1L)).thenReturn(List.of());
        when(energyAnalysisService.execute(
                        any(Property.class),
                        anyList(),
                        any(BigDecimal.class),
                        any(Boolean.class),
                        any(BigDecimal.class),
                        any()))
                .thenThrow(new MlServiceUnavailableException(
                        "Serviço de análise temporariamente indisponível. Tente novamente em instantes."));

        mockMvc.perform(post("/energy-analysis")
                        .cookie(sessionCookie())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_BODY))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.message")
                        .value("Serviço de análise temporariamente indisponível. Tente novamente em instantes."));
    }

    @Test
    void shouldReturn400WhenPropertyIsInactive() throws Exception {
        mockAuthenticatedSession(1L);
        when(propertyService.getOwned(10L, 1L)).thenReturn(ownedProperty());
        when(propertyService.listAppliances(10L, 1L)).thenReturn(List.of());
        when(energyAnalysisService.execute(
                        any(Property.class),
                        anyList(),
                        any(BigDecimal.class),
                        any(Boolean.class),
                        any(BigDecimal.class),
                        any()))
                .thenThrow(new InvalidRequestException("A propriedade está inativa e não pode receber análises."));

        mockMvc.perform(post("/energy-analysis")
                        .cookie(sessionCookie())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_BODY))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("A propriedade está inativa e não pode receber análises."));
    }

    @Test
    void shouldReturn403WhenAccessingAnotherUsersProperty() throws Exception {
        mockAuthenticatedSession(1L);
        when(propertyService.getOwned(10L, 1L))
                .thenThrow(new ForbiddenOperationException("Você não tem acesso a esta propriedade."));

        mockMvc.perform(post("/energy-analysis")
                        .cookie(sessionCookie())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_BODY))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Você não tem acesso a esta propriedade."));
    }

    @Test
    void shouldReturn500OnUnexpectedError() throws Exception {
        mockAuthenticatedSession(1L);
        when(propertyService.getOwned(10L, 1L)).thenReturn(ownedProperty());
        when(propertyService.listAppliances(10L, 1L)).thenReturn(List.of());
        when(energyAnalysisService.execute(
                        any(Property.class),
                        anyList(),
                        any(BigDecimal.class),
                        any(Boolean.class),
                        any(BigDecimal.class),
                        any()))
                .thenThrow(new RuntimeException("falha inesperada"));

        mockMvc.perform(post("/energy-analysis")
                        .cookie(sessionCookie())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_BODY))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.message").value("Erro interno do servidor"));
    }

    @Test
    void shouldSimulateAnalysisWhenAuthenticated() throws Exception {
        mockAuthenticatedSession(1L);
        when(propertyService.getOwned(10L, 1L)).thenReturn(ownedProperty());
        when(propertyService.listAppliances(10L, 1L)).thenReturn(List.of());
        EnergySimulationResult simulation = new EnergySimulationResult(
                10L,
                new BigDecimal("108.00"),
                true,
                new BigDecimal("6.50"),
                new BigDecimal("81.00"),
                new EfficiencyCategory("BOM"),
                new BigDecimal("0.80"),
                "model",
                List.of("Reduza o consumo"),
                List.of("Geladeira"),
                List.of());
        when(energyAnalysisService.simulate(
                        any(Property.class),
                        anyList(),
                        any(BigDecimal.class),
                        any(Boolean.class),
                        any(BigDecimal.class),
                        any()))
                .thenReturn(simulation);

        mockMvc.perform(post("/energy-analysis/simulate")
                        .cookie(sessionCookie())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_BODY))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.property_id").value(10))
                .andExpect(jsonPath("$.category").value("BOM"))
                .andExpect(jsonPath("$.status").value("SIMULADO"))
                .andExpect(jsonPath("$.estimated_monthly_cost").value(81.00));
    }

    @Test
    void shouldReturn401WhenSimulatingWithoutSession() throws Exception {
        mockMvc.perform(post("/energy-analysis/simulate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_BODY))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldListAnalysesWhenAuthenticated() throws Exception {
        mockAuthenticatedSession(1L);
        when(propertyService.listByUserId(1L)).thenReturn(List.of(ownedProperty()));
        when(analysisRepository.listByPropertyIds(List.of(10L))).thenReturn(List.of(completedAnalysis()));

        mockMvc.perform(get("/analyses").cookie(sessionCookie()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(100))
                .andExpect(jsonPath("$[0].status").value("CONCLUIDA"));
    }

    @Test
    void shouldReturn401WhenListingAnalysesWithoutSession() throws Exception {
        mockMvc.perform(get("/analyses")).andExpect(status().isUnauthorized());
    }

    @Test
    void shouldReturnEmptyListWhenUserHasNoProperties() throws Exception {
        mockAuthenticatedSession(1L);
        when(propertyService.listByUserId(1L)).thenReturn(List.of());

        mockMvc.perform(get("/analyses").cookie(sessionCookie()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void shouldReturnAnalysisByIdWhenAuthenticated() throws Exception {
        mockAuthenticatedSession(1L);
        EnergyAnalysis analysis = completedAnalysis();
        when(analysisRepository.findById(100L)).thenReturn(Optional.of(analysis));
        when(propertyService.getOwned(10L, 1L)).thenReturn(ownedProperty());

        mockMvc.perform(get("/analyses/100").cookie(sessionCookie()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.category").value("EXCELENTE"));
    }

    @Test
    void shouldReturn404WhenAnalysisNotFound() throws Exception {
        mockAuthenticatedSession(1L);
        when(analysisRepository.findById(999L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/analyses/999").cookie(sessionCookie()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Análise não encontrada."));
    }

    @Test
    void shouldDeleteAnalysisWhenAuthenticated() throws Exception {
        mockAuthenticatedSession(1L);
        EnergyAnalysis analysis = completedAnalysis();
        when(analysisRepository.findById(100L)).thenReturn(Optional.of(analysis));
        when(propertyService.getOwned(10L, 1L)).thenReturn(ownedProperty());

        mockMvc.perform(delete("/analyses/100").cookie(sessionCookie())).andExpect(status().isNoContent());

        verify(analysisRepository).deleteById(100L);
    }

    @Test
    void shouldReturnDashboardWhenAuthenticated() throws Exception {
        mockAuthenticatedSession(1L);
        DashboardData dashboard =
                new DashboardData(2, 150.0, 200.0, 30.0, List.of(new MonthlyConsumption("jul./2026", 300.0)));
        when(dashboardService.build(1L)).thenReturn(dashboard);

        mockMvc.perform(get("/dashboard").cookie(sessionCookie()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total_analyses").value(2))
                .andExpect(jsonPath("$.average_consumption_kwh").value(150.0))
                .andExpect(jsonPath("$.total_estimated_cost").value(200.0))
                .andExpect(jsonPath("$.total_co2_emission_kg").value(30.0))
                .andExpect(jsonPath("$.monthly_consumption[0].month").value(endsWith("/2026")))
                .andExpect(jsonPath("$.monthly_consumption[0].consumption_kwh").value(300.0));
    }

    @Test
    void shouldReturn401OnDashboardWithoutSession() throws Exception {
        mockMvc.perform(get("/dashboard")).andExpect(status().isUnauthorized());
    }

    @Test
    void shouldReturnEfficiencyCategories() throws Exception {
        when(mlContract.efficiencyCategories()).thenReturn(List.of("EXCELENTE", "BOM"));

        mockMvc.perform(get("/energy-analysis/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0]").value("EXCELENTE"))
                .andExpect(jsonPath("$[1]").value("BOM"));
    }

    @Test
    void shouldReturn401WhenAccessingAnalysesWithBlacklistedToken() throws Exception {
        when(jwtService.hashToken(SESSION_TOKEN)).thenReturn(TOKEN_HASH);
        when(tokenBlacklistRepository.existsByTokenHash(TOKEN_HASH)).thenReturn(true);

        mockMvc.perform(get("/analyses").cookie(sessionCookie())).andExpect(status().isUnauthorized());
    }
}
