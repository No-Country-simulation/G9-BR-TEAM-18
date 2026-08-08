package br.com.group18.energiai;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import br.com.group18.energiai.core.domain.model.EquipmentCategory;
import org.junit.jupiter.api.Test;

class EquipmentCategoryTest {

    @Test
    void fromEnglishShouldResolveAllKnownCategories() {
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
    void fromEnglishShouldReturnEmptyOptionalForUnknownCategory() {
        assertTrue(EquipmentCategory.fromEnglish("INVALID_CATEGORY_XYZ").isEmpty());
        assertTrue(EquipmentCategory.fromEnglish(null).isEmpty());
        assertTrue(EquipmentCategory.fromEnglish("   ").isEmpty());
    }

    @Test
    void toEnglishFromPortugueseShouldRebuildEnglishValueForAdr27Contract() {
        assertEquals("REFRIGERATION", EquipmentCategory.toEnglishFromPortuguese("Refrigeração"));
        assertEquals("CLIMATE_CONTROL", EquipmentCategory.toEnglishFromPortuguese("Climatização"));
        assertEquals("TECHNOLOGY", EquipmentCategory.toEnglishFromPortuguese("Tecnologia"));
        assertEquals("LIGHTING", EquipmentCategory.toEnglishFromPortuguese("Iluminação"));
        assertEquals("APPLIANCES", EquipmentCategory.toEnglishFromPortuguese("Eletrodomésticos"));
        assertEquals("SERVICES", EquipmentCategory.toEnglishFromPortuguese("Serviços"));
    }

    @Test
    void toEnglishFromPortugueseShouldNotBreakForUnrecognizedValue() {
        assertEquals("Categoria Inexistente", EquipmentCategory.toEnglishFromPortuguese("Categoria Inexistente"));
        assertNull(EquipmentCategory.toEnglishFromPortuguese(null));
    }
}
