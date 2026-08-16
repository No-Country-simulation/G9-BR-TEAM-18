package br.com.group18.energiai;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import br.com.group18.energiai.core.domain.model.Appliance;
import br.com.group18.energiai.core.domain.model.Property;
import br.com.group18.energiai.core.domain.model.PropertyAppliance;
import br.com.group18.energiai.core.domain.model.User;
import br.com.group18.energiai.infrastructure.adapters.out.persistence.adapter.ApplianceRepositoryAdapter;
import br.com.group18.energiai.infrastructure.adapters.out.persistence.adapter.PropertyApplianceRepositoryAdapter;
import br.com.group18.energiai.infrastructure.adapters.out.persistence.adapter.PropertyRepositoryAdapter;
import br.com.group18.energiai.infrastructure.adapters.out.persistence.adapter.UserRepositoryAdapter;
import br.com.group18.energiai.infrastructure.adapters.out.persistence.entity.ApplianceEntity;
import br.com.group18.energiai.infrastructure.adapters.out.persistence.entity.PropertyApplianceEntity;
import br.com.group18.energiai.infrastructure.adapters.out.persistence.entity.PropertyEntity;
import br.com.group18.energiai.infrastructure.adapters.out.persistence.entity.UserEntity;
import br.com.group18.energiai.infrastructure.adapters.out.persistence.mapper.ApplianceMapper;
import br.com.group18.energiai.infrastructure.adapters.out.persistence.mapper.PropertyApplianceMapper;
import br.com.group18.energiai.infrastructure.adapters.out.persistence.mapper.PropertyMapper;
import br.com.group18.energiai.infrastructure.adapters.out.persistence.mapper.UserMapper;
import br.com.group18.energiai.infrastructure.adapters.out.persistence.repository.ApplianceJpaRepository;
import br.com.group18.energiai.infrastructure.adapters.out.persistence.repository.PropertyApplianceJpaRepository;
import br.com.group18.energiai.infrastructure.adapters.out.persistence.repository.PropertyJpaRepository;
import br.com.group18.energiai.infrastructure.adapters.out.persistence.repository.UserJpaRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class RepositoryAdaptersTest {

    private UserJpaRepository userJpaRepository;
    private PropertyJpaRepository propertyJpaRepository;
    private ApplianceJpaRepository applianceJpaRepository;
    private PropertyApplianceJpaRepository propertyApplianceJpaRepository;

    private UserRepositoryAdapter userAdapter;
    private PropertyRepositoryAdapter propertyAdapter;
    private ApplianceRepositoryAdapter applianceAdapter;
    private PropertyApplianceRepositoryAdapter propertyApplianceAdapter;

    @BeforeEach
    void setUp() {
        userJpaRepository = mock(UserJpaRepository.class);
        propertyJpaRepository = mock(PropertyJpaRepository.class);
        applianceJpaRepository = mock(ApplianceJpaRepository.class);
        propertyApplianceJpaRepository = mock(PropertyApplianceJpaRepository.class);

        userAdapter = new UserRepositoryAdapter(userJpaRepository, new UserMapper());
        propertyAdapter = new PropertyRepositoryAdapter(propertyJpaRepository, new PropertyMapper());
        applianceAdapter = new ApplianceRepositoryAdapter(applianceJpaRepository, new ApplianceMapper());
        propertyApplianceAdapter = new PropertyApplianceRepositoryAdapter(
                propertyApplianceJpaRepository,
                applianceJpaRepository,
                new PropertyApplianceMapper(new ApplianceMapper()));
    }

    @Test
    void shouldSaveUserAndReturnDomain() {
        User user = new User("Nome", "email@email.com", "hash");
        when(userJpaRepository.save(any(UserEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        User result = userAdapter.save(user);

        assertEquals("Nome", result.getName());
        assertEquals("email@email.com", result.getEmail());
        assertEquals("hash", result.getPasswordHash());
    }

    @Test
    void shouldFindUserByEmailAndById() {
        UserEntity entity = new UserEntity();
        entity.setId(1L);
        entity.setName("Nome");
        entity.setEmail("email@email.com");
        entity.setPasswordHash("hash");
        when(userJpaRepository.findByEmail("email@email.com")).thenReturn(Optional.of(entity));
        when(userJpaRepository.findById(1L)).thenReturn(Optional.of(entity));

        assertTrue(userAdapter.findByEmail("email@email.com").isPresent());
        assertTrue(userAdapter.findById(1L).isPresent());
        assertTrue(userAdapter.findByEmail("outro@email.com").isEmpty());
        assertTrue(userAdapter.findById(99L).isEmpty());
    }

    @Test
    void shouldSavePropertyAndReturnDomain() {
        Property property = new Property(1L, "Casa", "RESIDENCIAL");
        PropertyEntity savedEntity = new PropertyEntity();
        savedEntity.setId(10L);
        savedEntity.setUserId(1L);
        savedEntity.setAlias("Casa");
        savedEntity.setPropertyType("RESIDENCIAL");
        when(propertyJpaRepository.save(any(PropertyEntity.class))).thenReturn(savedEntity);

        Property result = propertyAdapter.save(property);

        assertEquals(10L, result.getId());
        assertEquals("Casa", result.getAlias());
    }

    @Test
    void shouldFindPropertiesByUserAndByIdAndDelete() {
        PropertyEntity entity = new PropertyEntity();
        entity.setId(10L);
        entity.setUserId(1L);
        entity.setAlias("Casa");
        entity.setPropertyType("RESIDENCIAL");
        when(propertyJpaRepository.findByUserIdOrderByAliasAsc(1L)).thenReturn(List.of(entity));
        when(propertyJpaRepository.findById(10L)).thenReturn(Optional.of(entity));

        List<Property> properties = propertyAdapter.findByUserId(1L);

        assertEquals(1, properties.size());
        assertEquals("Casa", properties.get(0).getAlias());
        assertTrue(propertyAdapter.findById(10L).isPresent());

        propertyAdapter.delete(properties.get(0));

        verify(propertyJpaRepository).delete(any(PropertyEntity.class));
    }

    @Test
    void shouldFindAllAppliancesOrderedByNameAndByIdAndSave() {
        ApplianceEntity entity = new ApplianceEntity();
        entity.setId(3L);
        entity.setName("Geladeira");
        entity.setApplianceCategory("REFRIGERATION");
        when(applianceJpaRepository.findAllByOrderByNameAsc()).thenReturn(List.of(entity));
        when(applianceJpaRepository.findById(3L)).thenReturn(Optional.of(entity));
        when(applianceJpaRepository.save(any(ApplianceEntity.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        List<Appliance> appliances = applianceAdapter.findAll();

        assertEquals(1, appliances.size());
        assertEquals("Geladeira", appliances.get(0).getName());
        assertTrue(applianceAdapter.findById(3L).isPresent());

        Appliance saved = applianceAdapter.save(appliances.get(0));

        assertEquals(3L, saved.getId());
        assertEquals("Geladeira", saved.getName());
        verify(applianceJpaRepository).save(any(ApplianceEntity.class));
    }

    @Test
    void shouldSavePropertyApplianceWithApplianceReference() {
        Appliance appliance =
                new Appliance(3L, "Geladeira", "REFRIGERATION", new BigDecimal("150.00"), new BigDecimal("24.00"));
        PropertyAppliance propertyAppliance = new PropertyAppliance(10L, appliance, 2);
        ApplianceEntity applianceEntity = new ApplianceEntity();
        applianceEntity.setId(3L);
        applianceEntity.setName("Geladeira");
        applianceEntity.setApplianceCategory("REFRIGERATION");
        PropertyApplianceEntity savedEntity = new PropertyApplianceEntity();
        savedEntity.setId(50L);
        savedEntity.setPropertyId(10L);
        savedEntity.setAppliance(applianceEntity);
        savedEntity.setQuantity(2);
        when(applianceJpaRepository.getReferenceById(3L)).thenReturn(applianceEntity);
        when(propertyApplianceJpaRepository.save(any(PropertyApplianceEntity.class)))
                .thenReturn(savedEntity);

        PropertyAppliance result = propertyApplianceAdapter.save(propertyAppliance);

        assertEquals(50L, result.getId());
        assertEquals(10L, result.getPropertyId());
        assertEquals(2, result.getQuantity());
        assertEquals("Geladeira", result.getAppliance().getName());
    }

    @Test
    void shouldFindPropertyAppliancesByPropertyAndDelete() {
        ApplianceEntity applianceEntity = new ApplianceEntity();
        applianceEntity.setId(3L);
        applianceEntity.setName("Geladeira");
        PropertyApplianceEntity entity = new PropertyApplianceEntity();
        entity.setId(50L);
        entity.setPropertyId(10L);
        entity.setAppliance(applianceEntity);
        entity.setQuantity(2);
        when(propertyApplianceJpaRepository.findByPropertyIdOrderByIdAsc(10L)).thenReturn(List.of(entity));
        when(propertyApplianceJpaRepository.findByPropertyIdAndAppliance_Id(10L, 3L))
                .thenReturn(Optional.of(entity));
        when(applianceJpaRepository.getReferenceById(3L)).thenReturn(applianceEntity);

        List<PropertyAppliance> linked = propertyApplianceAdapter.findByPropertyId(10L);

        assertEquals(1, linked.size());
        assertEquals(2, linked.get(0).getQuantity());
        assertTrue(
                propertyApplianceAdapter.findByPropertyIdAndApplianceId(10L, 3L).isPresent());

        propertyApplianceAdapter.delete(linked.get(0));

        verify(propertyApplianceJpaRepository).delete(any(PropertyApplianceEntity.class));
    }
}
