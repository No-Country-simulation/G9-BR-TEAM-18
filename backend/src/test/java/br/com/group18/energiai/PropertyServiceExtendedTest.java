package br.com.group18.energiai;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import br.com.group18.energiai.application.exception.ResourceNotFoundException;
import br.com.group18.energiai.application.services.PropertyService;
import br.com.group18.energiai.application.services.PropertyService.ApplianceQuantity;
import br.com.group18.energiai.core.domain.model.Appliance;
import br.com.group18.energiai.core.domain.model.Property;
import br.com.group18.energiai.core.domain.model.PropertyAppliance;
import br.com.group18.energiai.core.ports.out.ApplianceRepositoryPort;
import br.com.group18.energiai.core.ports.out.PropertyApplianceRepositoryPort;
import br.com.group18.energiai.core.ports.out.PropertyRepositoryPort;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PropertyServiceExtendedTest {

    @Mock
    private PropertyRepositoryPort propertyRepository;

    @Mock
    private ApplianceRepositoryPort applianceRepository;

    @Mock
    private PropertyApplianceRepositoryPort propertyApplianceRepository;

    @InjectMocks
    private PropertyService propertyService;

    private Property testProperty;

    @BeforeEach
    void setUp() {
        testProperty = new Property(1L, "Minha Casa", "RESIDENCIAL");
        testProperty.setId(100L);
    }

    @Test
    void shouldCreateProperty() {
        when(propertyRepository.save(any(Property.class))).thenAnswer(i -> i.getArgument(0));

        Property result = propertyService.create(1L, "Minha Casa", "RESIDENCIAL", "Rua A, 123", 3, 120.0);

        assertNotNull(result);
        assertEquals("Minha Casa", result.getAlias());
        assertEquals("RESIDENCIAL", result.getPropertyType());
        assertEquals("Rua A, 123", result.getAddress());
        assertEquals(3, result.getResidentCount());
        assertEquals(120.0, result.getAreaSqm(), 0.01);
    }

    @Test
    void shouldCreatePropertyWithOptionalFieldsNull() {
        when(propertyRepository.save(any(Property.class))).thenAnswer(i -> i.getArgument(0));

        Property result = propertyService.create(1L, "Casa", "RESIDENCIAL", null, null, null);

        assertNotNull(result);
        assertEquals("Casa", result.getAlias());
        assertEquals("RESIDENCIAL", result.getPropertyType());
        assertNull(result.getAddress());
        assertNull(result.getResidentCount());
        assertNull(result.getAreaSqm());
    }

    @Test
    void shouldListByUserId() {
        List<Property> properties = List.of(testProperty);
        when(propertyRepository.findByUserId(1L)).thenReturn(properties);

        List<Property> result = propertyService.listByUserId(1L);

        assertEquals(1, result.size());
        assertEquals("Minha Casa", result.get(0).getAlias());
    }

    @Test
    void shouldReturnEmptyListWhenNoProperties() {
        when(propertyRepository.findByUserId(99L)).thenReturn(List.of());

        List<Property> result = propertyService.listByUserId(99L);

        assertTrue(result.isEmpty());
    }

    @Test
    void shouldGetOwnedProperty() {
        when(propertyRepository.findById(100L)).thenReturn(Optional.of(testProperty));

        Property result = propertyService.getOwned(100L, 1L);

        assertNotNull(result);
        assertEquals("Minha Casa", result.getAlias());
    }

    @Test
    void shouldThrowResourceNotFoundForNonExistentProperty() {
        when(propertyRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> propertyService.getOwned(999L, 1L));
    }

    @Test
    void shouldUpdateProperty() {
        when(propertyRepository.findById(100L)).thenReturn(Optional.of(testProperty));
        when(propertyRepository.save(any(Property.class))).thenAnswer(i -> i.getArgument(0));

        Property result = propertyService.update(100L, 1L, "Casa Atualizada", "COMERCIAL", true, "Av B, 456", 5, 200.0);

        assertEquals("Casa Atualizada", result.getAlias());
        assertEquals("COMERCIAL", result.getPropertyType());
        assertTrue(result.isActive());
        assertEquals("Av B, 456", result.getAddress());
        assertEquals(5, result.getResidentCount());
        assertEquals(200.0, result.getAreaSqm(), 0.01);
    }

    @Test
    void shouldDeleteProperty() {
        when(propertyRepository.findById(100L)).thenReturn(Optional.of(testProperty));

        propertyService.delete(100L, 1L);

        verify(propertyRepository).delete(testProperty);
    }

    @Test
    void shouldListAppliances() {
        Appliance ar =
                new Appliance(1L, "Ar Condicionado", "Climatizacao", new BigDecimal("1500.0"), new BigDecimal("8.0"));
        PropertyAppliance pa = new PropertyAppliance(100L, ar, 2);

        when(propertyRepository.findById(100L)).thenReturn(Optional.of(testProperty));
        when(propertyApplianceRepository.findByPropertyId(100L)).thenReturn(List.of(pa));

        List<PropertyAppliance> result = propertyService.listAppliances(100L, 1L);

        assertEquals(1, result.size());
        assertEquals(2, result.get(0).getQuantity());
    }

    @Test
    void shouldAddOrUpdateAppliance() {
        Appliance ar =
                new Appliance(1L, "Ar Condicionado", "Climatizacao", new BigDecimal("1500.0"), new BigDecimal("8.0"));

        when(propertyRepository.findById(100L)).thenReturn(Optional.of(testProperty));
        when(applianceRepository.findById(1L)).thenReturn(Optional.of(ar));
        when(propertyApplianceRepository.findByPropertyIdAndApplianceId(100L, 1L))
                .thenReturn(Optional.empty());
        when(propertyApplianceRepository.save(any(PropertyAppliance.class))).thenAnswer(i -> i.getArgument(0));

        PropertyAppliance result = propertyService.addOrUpdateAppliance(100L, 1L, 1L, 3);

        assertNotNull(result);
        assertEquals(3, result.getQuantity());
    }

    @Test
    void shouldThrowResourceNotFoundWhenAddingNonExistentAppliance() {
        when(propertyRepository.findById(100L)).thenReturn(Optional.of(testProperty));
        when(applianceRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> propertyService.addOrUpdateAppliance(100L, 1L, 999L, 1));
    }

    @Test
    void shouldRemoveAppliance() {
        Appliance ar =
                new Appliance(1L, "Ar Condicionado", "Climatizacao", new BigDecimal("1500.0"), new BigDecimal("8.0"));
        PropertyAppliance pa = new PropertyAppliance(100L, ar, 2);

        when(propertyRepository.findById(100L)).thenReturn(Optional.of(testProperty));
        when(propertyApplianceRepository.findByPropertyIdAndApplianceId(100L, 1L))
                .thenReturn(Optional.of(pa));

        propertyService.removeAppliance(100L, 1L, 1L);

        verify(propertyApplianceRepository).delete(pa);
    }

    @Test
    void shouldThrowWhenRemovingApplianceNotLinked() {
        when(propertyRepository.findById(100L)).thenReturn(Optional.of(testProperty));
        when(propertyApplianceRepository.findByPropertyIdAndApplianceId(100L, 999L))
                .thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> propertyService.removeAppliance(100L, 1L, 999L));
    }

    @Test
    void shouldBatchUpdateAppliances() {
        Appliance ar =
                new Appliance(1L, "Ar Condicionado", "Climatizacao", new BigDecimal("1500.0"), new BigDecimal("8.0"));
        Appliance geladeira =
                new Appliance(2L, "Geladeira", "Refrigeracao", new BigDecimal("150.0"), new BigDecimal("24.0"));
        PropertyAppliance oldPa = new PropertyAppliance(100L, ar, 2);

        when(propertyRepository.findById(100L)).thenReturn(Optional.of(testProperty));
        when(propertyApplianceRepository.findByPropertyId(100L)).thenReturn(List.of(oldPa));
        when(applianceRepository.findById(1L)).thenReturn(Optional.of(ar));
        when(applianceRepository.findById(2L)).thenReturn(Optional.of(geladeira));
        when(propertyApplianceRepository.findByPropertyIdAndApplianceId(100L, 1L))
                .thenReturn(Optional.of(oldPa));
        when(propertyApplianceRepository.findByPropertyIdAndApplianceId(100L, 2L))
                .thenReturn(Optional.empty());
        when(propertyApplianceRepository.save(any(PropertyAppliance.class))).thenAnswer(i -> i.getArgument(0));

        List<ApplianceQuantity> items = List.of(new ApplianceQuantity(1L, 1), new ApplianceQuantity(2L, 3));

        List<PropertyAppliance> result = propertyService.batchUpdateAppliances(100L, 1L, items);

        assertEquals(2, result.size());
        verify(propertyApplianceRepository).delete(oldPa);
    }
}
