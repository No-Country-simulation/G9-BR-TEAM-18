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
    void deveIgnorarListasNulasNoRegistroEManterFallback() {
        MlContractResponse contratoComNulos = new MlContractResponse(null, null, null);
        MlApplianceCatalogResponse catalogoComNulos = new MlApplianceCatalogResponse(null);

        int tamanhoFallbackPropriedades = registry.getPropertyTypes().size();
        int tamanhoFallbackEficiencia = registry.getEfficiencyCategories().size();
        int tamanhoFallbackConsumo = registry.getConsumptionCategories().size();
        int tamanhoFallbackCatalogo = registry.getApplianceCatalog().size();

        assertDoesNotThrow(() -> registry.register(contratoComNulos, catalogoComNulos));

        assertNotNull(registry.getPropertyTypes());
        assertFalse(registry.getPropertyTypes().isEmpty());
        assertEquals(tamanhoFallbackPropriedades, registry.getPropertyTypes().size());

        assertNotNull(registry.getEfficiencyCategories());
        assertFalse(registry.getEfficiencyCategories().isEmpty());
        assertEquals(
                tamanhoFallbackEficiencia, registry.getEfficiencyCategories().size());

        assertNotNull(registry.getConsumptionCategories());
        assertFalse(registry.getConsumptionCategories().isEmpty());
        assertEquals(tamanhoFallbackConsumo, registry.getConsumptionCategories().size());

        assertNotNull(registry.getApplianceCatalog());
        assertFalse(registry.getApplianceCatalog().isEmpty());
        assertEquals(tamanhoFallbackCatalogo, registry.getApplianceCatalog().size());
    }
}
