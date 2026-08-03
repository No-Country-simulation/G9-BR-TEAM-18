package br.com.group18.energiai;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import br.com.group18.energiai.core.domain.model.EquipmentCategory;
import org.junit.jupiter.api.Test;

class EquipmentCategoryTest {

    @Test
    void deveConverterCategoriasDoInglesParaPortuguesCorretamente() {
        assertEquals("Refrigeração", EquipmentCategory.toPortugueseFromEnglish("REFRIGERATION"));
        assertEquals("Climatização", EquipmentCategory.toPortugueseFromEnglish("CLIMATE_CONTROL"));
        assertEquals("Tecnologia", EquipmentCategory.toPortugueseFromEnglish("TECHNOLOGY"));
        assertEquals("Iluminação", EquipmentCategory.toPortugueseFromEnglish("LIGHTING"));
        assertEquals("Eletrodomésticos", EquipmentCategory.toPortugueseFromEnglish("APPLIANCES"));
        assertEquals("Serviços", EquipmentCategory.toPortugueseFromEnglish("SERVICES"));
    }

    @Test
    void deveRetornarOutrosParaCategoriaDesconhecida() {
        assertEquals("Outros", EquipmentCategory.toPortugueseFromEnglish("INVALID_CATEGORY_XYZ"));
        assertEquals("Outros", EquipmentCategory.toPortugueseFromEnglish(null));
        assertEquals("Outros", EquipmentCategory.toPortugueseFromEnglish("   "));
    }

    @Test
    void fromEnglishDeveResolverTodasAsCategoriasConhecidas() {
        assertEquals(
                EquipmentCategory.REFRIGERATION,
                EquipmentCategory.fromEnglish("REFRIGERATION").orElseThrow());
        assertEquals(
                EquipmentCategory.CLIMATE_CONTROL,
                EquipmentCategory.fromEnglish("climate_control").orElseThrow());
        assertEquals(
                EquipmentCategory.SERVICES,
                EquipmentCategory.fromEnglish("  Services  ").orElseThrow());
    }

    @Test
    void fromEnglishDeveRetornarOptionalVazioParaCategoriaDesconhecida() {
        assertTrue(EquipmentCategory.fromEnglish("INVALID_CATEGORY_XYZ").isEmpty());
        assertTrue(EquipmentCategory.fromEnglish(null).isEmpty());
        assertTrue(EquipmentCategory.fromEnglish("   ").isEmpty());
    }

    @Test
    void toEnglishFromPortugueseDeveReconstruirValorEmInglesParaOContratoAdr0027() {
        assertEquals("REFRIGERATION", EquipmentCategory.toEnglishFromPortuguese("Refrigeração"));
        assertEquals("CLIMATE_CONTROL", EquipmentCategory.toEnglishFromPortuguese("Climatização"));
        assertEquals("TECHNOLOGY", EquipmentCategory.toEnglishFromPortuguese("Tecnologia"));
        assertEquals("LIGHTING", EquipmentCategory.toEnglishFromPortuguese("Iluminação"));
        assertEquals("APPLIANCES", EquipmentCategory.toEnglishFromPortuguese("Eletrodomésticos"));
        assertEquals("SERVICES", EquipmentCategory.toEnglishFromPortuguese("Serviços"));
    }

    @Test
    void toEnglishFromPortugueseNaoDeveQuebrarParaValorNaoReconhecido() {
        assertEquals("Categoria Inexistente", EquipmentCategory.toEnglishFromPortuguese("Categoria Inexistente"));
        assertNull(EquipmentCategory.toEnglishFromPortuguese(null));
    }
}
