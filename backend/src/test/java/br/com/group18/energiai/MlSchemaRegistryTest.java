package br.com.group18.energiai;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import br.com.group18.energiai.infrastructure.client.MlSchemaRegistry;
import br.com.group18.energiai.infrastructure.client.dto.MlApplianceCatalogResponse;
import br.com.group18.energiai.infrastructure.client.dto.MlContractResponse;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class MlSchemaRegistryTest {

    private MlSchemaRegistry registry;

    @BeforeEach
    void setUp() {
        registry = new MlSchemaRegistry(List.of("EXCELENTE", "BOM", "MEDIANO", "RUIM", "CRITICO"));
        registry.loadDefaultValues();
    }

    @Test
    void shouldIgnoreNullListsAndKeepFallback() {
        MlContractResponse contratoComNulos = new MlContractResponse(null, null, null);
        MlApplianceCatalogResponse catalogoComNulos = new MlApplianceCatalogResponse(null);

        int tamanhoFallbackPropriedades = registry.propertyTypes().size();
        int tamanhoFallbackEficiencia = registry.efficiencyCategories().size();
        int tamanhoFallbackConsumo = registry.consumptionCategories().size();
        int tamanhoFallbackCatalogo = registry.applianceCatalog().size();

        assertDoesNotThrow(() -> registry.register(contratoComNulos, catalogoComNulos));

        assertNotNull(registry.propertyTypes());
        assertFalse(registry.propertyTypes().isEmpty());
        assertEquals(tamanhoFallbackPropriedades, registry.propertyTypes().size());

        assertNotNull(registry.efficiencyCategories());
        assertFalse(registry.efficiencyCategories().isEmpty());
        assertEquals(tamanhoFallbackEficiencia, registry.efficiencyCategories().size());

        assertNotNull(registry.consumptionCategories());
        assertFalse(registry.consumptionCategories().isEmpty());
        assertEquals(tamanhoFallbackConsumo, registry.consumptionCategories().size());

        assertNotNull(registry.applianceCatalog());
        assertFalse(registry.applianceCatalog().isEmpty());
        assertEquals(tamanhoFallbackCatalogo, registry.applianceCatalog().size());
    }
}
