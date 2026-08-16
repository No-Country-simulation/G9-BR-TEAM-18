package br.com.group18.energiai;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.com.group18.energiai.application.services.PropertyService;
import br.com.group18.energiai.core.domain.model.Appliance;
import br.com.group18.energiai.core.domain.model.Property;
import br.com.group18.energiai.core.domain.model.PropertyAppliance;
import br.com.group18.energiai.core.ports.out.TokenBlacklistRepositoryPort;
import br.com.group18.energiai.infrastructure.adapters.in.web.controllers.PropertyController;
import br.com.group18.energiai.infrastructure.config.JwtService;
import jakarta.servlet.http.Cookie;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(
        controllers = PropertyController.class,
        properties = {"spring.jackson.property-naming-strategy=SNAKE_CASE"})
class PropertyControllerTest {

    private static final String SESSION_TOKEN = "valid.session.token";
    private static final String TOKEN_HASH = "hash-of-valid-token";

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private PropertyService propertyService;

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

    private Property residentialProperty() {
        Property property = new Property(1L, "Minha Casa", "RESIDENCIAL");
        property.setId(10L);
        property.setActive(true);
        return property;
    }

    private PropertyAppliance linkedAppliance() {
        Appliance appliance =
                new Appliance(5L, "Ar Condicionado", "Climatização", new BigDecimal("1500.0"), new BigDecimal("8.0"));
        PropertyAppliance propertyAppliance = new PropertyAppliance(10L, appliance, 2);
        propertyAppliance.setId(50L);
        return propertyAppliance;
    }

    @Test
    void shouldReturn401WhenCreatingPropertyWithoutSession() throws Exception {
        String body =
                """
                {
                    "alias": "Minha Casa",
                    "property_type": "RESIDENCIAL"
                }
                """;

        mockMvc.perform(post("/properties")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldCreateResidentialPropertyWhenAuthenticated() throws Exception {
        mockAuthenticatedSession(1L);
        when(propertyService.create(1L, "Minha Casa", "RESIDENCIAL", null, null, null))
                .thenReturn(residentialProperty());

        String body =
                """
                {
                    "alias": "Minha Casa",
                    "property_type": "RESIDENCIAL"
                }
                """;

        mockMvc.perform(post("/properties")
                        .cookie(sessionCookie())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.alias").value("Minha Casa"))
                .andExpect(jsonPath("$.property_type").value("RESIDENCIAL"))
                .andExpect(jsonPath("$.active").value(true));
    }

    @Test
    void shouldCreateCommercialPropertyWhenAuthenticated() throws Exception {
        mockAuthenticatedSession(1L);
        Property commercial = new Property(1L, "Meu Escritório", "COMERCIAL");
        commercial.setId(11L);
        when(propertyService.create(1L, "Meu Escritório", "COMERCIAL", null, null, null))
                .thenReturn(commercial);

        String body =
                """
                {
                    "alias": "Meu Escritório",
                    "property_type": "COMERCIAL"
                }
                """;

        mockMvc.perform(post("/properties")
                        .cookie(sessionCookie())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.property_type").value("COMERCIAL"));
    }

    @Test
    void shouldReturn409WhenCreatingPropertyViolatesConstraint() throws Exception {
        mockAuthenticatedSession(1L);
        when(propertyService.create(any(Long.class), anyString(), anyString(), any(), any(), any()))
                .thenThrow(new DataIntegrityViolationException("unique constraint"));

        String body =
                """
                {
                    "alias": "Duplicada",
                    "property_type": "RESIDENCIAL"
                }
                """;

        mockMvc.perform(post("/properties")
                        .cookie(sessionCookie())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("A operação viola uma restrição de dados."));
    }

    @Test
    void shouldReturn400WhenPropertyTypeIsInvalid() throws Exception {
        mockAuthenticatedSession(1L);

        String body =
                """
                {
                    "alias": "Teste",
                    "property_type": "Casa"
                }
                """;

        mockMvc.perform(post("/properties")
                        .cookie(sessionCookie())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldReturn400WhenAliasIsMissing() throws Exception {
        mockAuthenticatedSession(1L);

        String body =
                """
                {
                    "property_type": "RESIDENCIAL"
                }
                """;

        mockMvc.perform(post("/properties")
                        .cookie(sessionCookie())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldListPropertiesWhenAuthenticated() throws Exception {
        mockAuthenticatedSession(1L);
        when(propertyService.listByUserId(1L)).thenReturn(List.of(residentialProperty()));

        mockMvc.perform(get("/properties").cookie(sessionCookie()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].alias").value("Minha Casa"))
                .andExpect(jsonPath("$[0].property_type").value("RESIDENCIAL"));
    }

    @Test
    void shouldReturn401WhenListingPropertiesWithoutSession() throws Exception {
        mockMvc.perform(get("/properties")).andExpect(status().isUnauthorized());
    }

    @Test
    void shouldUpdatePropertyWhenAuthenticated() throws Exception {
        mockAuthenticatedSession(1L);
        Property updated = new Property(1L, "Casa Atualizada", "COMERCIAL");
        updated.setId(10L);
        updated.setActive(true);
        updated.setAddress("Av B, 456");
        when(propertyService.update(eq(10L), eq(1L), anyString(), anyString(), anyBoolean(), anyString(), any(), any()))
                .thenReturn(updated);

        String body =
                """
                {
                    "alias": "Casa Atualizada",
                    "property_type": "COMERCIAL",
                    "active": true,
                    "address": "Av B, 456"
                }
                """;

        mockMvc.perform(put("/properties/10")
                        .cookie(sessionCookie())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.alias").value("Casa Atualizada"))
                .andExpect(jsonPath("$.property_type").value("COMERCIAL"));
    }

    @Test
    void shouldDeletePropertyWhenAuthenticated() throws Exception {
        mockAuthenticatedSession(1L);

        mockMvc.perform(delete("/properties/10").cookie(sessionCookie())).andExpect(status().isNoContent());

        verify(propertyService).delete(10L, 1L);
    }

    @Test
    void shouldListAppliancesWhenAuthenticated() throws Exception {
        mockAuthenticatedSession(1L);
        when(propertyService.listAppliances(10L, 1L)).thenReturn(List.of(linkedAppliance()));

        mockMvc.perform(get("/properties/10/appliances").cookie(sessionCookie()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].appliance_id").value(5))
                .andExpect(jsonPath("$[0].appliance_name").value("Ar Condicionado"))
                .andExpect(jsonPath("$[0].quantity").value(2));
    }

    @Test
    void shouldAddApplianceWhenAuthenticated() throws Exception {
        mockAuthenticatedSession(1L);
        when(propertyService.addOrUpdateAppliance(10L, 1L, 5L, 2)).thenReturn(linkedAppliance());

        String body =
                """
                {
                    "appliance_id": 5,
                    "quantity": 2
                }
                """;

        mockMvc.perform(post("/properties/10/appliances")
                        .cookie(sessionCookie())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.appliance_id").value(5))
                .andExpect(jsonPath("$.quantity").value(2));
    }

    @Test
    void shouldUpdateApplianceQuantityWhenAuthenticated() throws Exception {
        mockAuthenticatedSession(1L);
        Appliance appliance =
                new Appliance(5L, "Ar Condicionado", "Climatização", new BigDecimal("1500.0"), new BigDecimal("8.0"));
        PropertyAppliance updatedAppliance = new PropertyAppliance(10L, appliance, 3);
        updatedAppliance.setId(50L);
        when(propertyService.addOrUpdateAppliance(10L, 1L, 5L, 3)).thenReturn(updatedAppliance);

        String body =
                """
                {
                    "appliance_id": 5,
                    "quantity": 3
                }
                """;

        mockMvc.perform(put("/properties/10/appliances/5")
                        .cookie(sessionCookie())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.quantity").value(3));
    }

    @Test
    void shouldReturn400WhenApplianceIdInUrlMismatchesBody() throws Exception {
        mockAuthenticatedSession(1L);

        String body =
                """
                {
                    "appliance_id": 6,
                    "quantity": 3
                }
                """;

        mockMvc.perform(put("/properties/10/appliances/5")
                        .cookie(sessionCookie())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldBatchUpdateAppliancesWhenAuthenticated() throws Exception {
        mockAuthenticatedSession(1L);
        when(propertyService.batchUpdateAppliances(eq(10L), eq(1L), any(List.class)))
                .thenReturn(List.of(linkedAppliance()));

        String body =
                """
                [
                    {
                        "appliance_id": 5,
                        "quantity": 2
                    }
                ]
                """;

        mockMvc.perform(put("/properties/10/appliances/batch")
                        .cookie(sessionCookie())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].appliance_id").value(5))
                .andExpect(jsonPath("$[0].quantity").value(2));
    }

    @Test
    void shouldRemoveApplianceWhenAuthenticated() throws Exception {
        mockAuthenticatedSession(1L);

        mockMvc.perform(delete("/properties/10/appliances/5").cookie(sessionCookie()))
                .andExpect(status().isNoContent());

        verify(propertyService).removeAppliance(10L, 1L, 5L);
    }
}
