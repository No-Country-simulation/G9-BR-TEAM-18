package br.com.group18.energiai;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import br.com.group18.energiai.core.domain.model.Appliance;
import br.com.group18.energiai.core.domain.model.Property;
import br.com.group18.energiai.core.domain.model.PropertyAppliance;
import br.com.group18.energiai.core.domain.model.User;
import br.com.group18.energiai.infrastructure.adapters.out.persistence.entity.ApplianceEntity;
import br.com.group18.energiai.infrastructure.adapters.out.persistence.entity.PropertyApplianceEntity;
import br.com.group18.energiai.infrastructure.adapters.out.persistence.entity.PropertyEntity;
import br.com.group18.energiai.infrastructure.adapters.out.persistence.entity.UserEntity;
import br.com.group18.energiai.infrastructure.adapters.out.persistence.mapper.ApplianceMapper;
import br.com.group18.energiai.infrastructure.adapters.out.persistence.mapper.PropertyApplianceMapper;
import br.com.group18.energiai.infrastructure.adapters.out.persistence.mapper.PropertyMapper;
import br.com.group18.energiai.infrastructure.adapters.out.persistence.mapper.UserMapper;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

class PersistenceMappersTest {

    private final UserMapper userMapper = new UserMapper();
    private final PropertyMapper propertyMapper = new PropertyMapper();
    private final ApplianceMapper applianceMapper = new ApplianceMapper();
    private final PropertyApplianceMapper propertyApplianceMapper = new PropertyApplianceMapper(applianceMapper);

    @Test
    void shouldMapUserToEntityAndBack() {
        User user = new User("Nome", "email@email.com", "hash");
        user.setId(1L);
        user.setPasswordResetRequired(true);
        user.setConsumptionGoal(new BigDecimal("250.00"));
        user.setRegularity("mensal");
        user.setPeakHourUsage(true);
        user.setHighConsumptionHours(new BigDecimal("4.5"));

        UserEntity entity = userMapper.toEntity(user);

        assertEquals(1L, entity.getId());
        assertEquals("Nome", entity.getName());
        assertEquals("email@email.com", entity.getEmail());
        assertEquals("hash", entity.getPasswordHash());
        assertEquals(1, entity.getPasswordResetRequired());
        assertEquals(new BigDecimal("250.00"), entity.getConsumptionGoal());
        assertEquals("mensal", entity.getRegularity());
        assertEquals(1, entity.getPeakHourUsage());
        assertEquals(new BigDecimal("4.5"), entity.getHighConsumptionHours());

        User roundTripped = userMapper.toDomain(entity);

        assertEquals(user.getId(), roundTripped.getId());
        assertEquals(user.getName(), roundTripped.getName());
        assertEquals(user.getEmail(), roundTripped.getEmail());
        assertEquals(user.getPasswordHash(), roundTripped.getPasswordHash());
        assertEquals(user.isPasswordResetRequired(), roundTripped.isPasswordResetRequired());
        assertEquals(user.getConsumptionGoal(), roundTripped.getConsumptionGoal());
        assertEquals(user.getRegularity(), roundTripped.getRegularity());
        assertEquals(user.getPeakHourUsage(), roundTripped.getPeakHourUsage());
        assertEquals(user.getHighConsumptionHours(), roundTripped.getHighConsumptionHours());
    }

    @Test
    void shouldMapUserWithoutPeakHourUsageToNullFlags() {
        User user = new User("Nome", "email@email.com", "hash");
        user.setPeakHourUsage(null);

        UserEntity entity = userMapper.toEntity(user);

        assertNull(entity.getPeakHourUsage());

        UserEntity entityWithoutFlag = new UserEntity();
        entityWithoutFlag.setPeakHourUsage(null);

        User domain = userMapper.toDomain(entityWithoutFlag);

        assertNull(domain.getPeakHourUsage());
    }

    @Test
    void shouldReturnNullForNullUserInBothDirections() {
        assertNull(userMapper.toEntity(null));
        assertNull(userMapper.toDomain(null));
    }

    @Test
    void shouldMapPropertyToEntityAndBack() {
        Property property = new Property(1L, "Minha Casa", "RESIDENCIAL");
        property.setId(10L);
        property.setActive(true);
        property.setAddress("Rua A, 123");
        property.setResidentCount(3);
        property.setAreaSqm(120.5);

        PropertyEntity entity = propertyMapper.toEntity(property);

        assertEquals(10L, entity.getId());
        assertEquals(1L, entity.getUserId());
        assertEquals("Minha Casa", entity.getAlias());
        assertEquals("RESIDENCIAL", entity.getPropertyType());
        assertEquals(1, entity.getActive());
        assertEquals("Rua A, 123", entity.getAddress());
        assertEquals(3, entity.getResidentCount());
        assertEquals(120.5, entity.getAreaSqm());

        Property roundTripped = propertyMapper.toDomain(entity);

        assertEquals(property.getId(), roundTripped.getId());
        assertEquals(property.getUserId(), roundTripped.getUserId());
        assertEquals(property.getAlias(), roundTripped.getAlias());
        assertEquals(property.getPropertyType(), roundTripped.getPropertyType());
        assertEquals(property.isActive(), roundTripped.isActive());
        assertEquals(property.getAddress(), roundTripped.getAddress());
        assertEquals(property.getResidentCount(), roundTripped.getResidentCount());
        assertEquals(property.getAreaSqm(), roundTripped.getAreaSqm());
    }

    @Test
    void shouldMapInactivePropertyFromEntityWithZeroActiveFlag() {
        PropertyEntity entity = new PropertyEntity();
        entity.setId(5L);
        entity.setUserId(2L);
        entity.setAlias("Casa");
        entity.setPropertyType("COMERCIAL");
        entity.setActive(0);

        Property domain = propertyMapper.toDomain(entity);

        assertEquals(5L, domain.getId());
        assertEquals(2L, domain.getUserId());
        assertEquals("COMERCIAL", domain.getPropertyType());
        assertEquals(false, domain.isActive());
    }

    @Test
    void shouldMapApplianceToEntityAndBack() {
        Appliance appliance =
                new Appliance(3L, "Geladeira", "REFRIGERATION", new BigDecimal("150.00"), new BigDecimal("24.00"));

        ApplianceEntity entity = applianceMapper.toEntity(appliance);

        assertEquals(3L, entity.getId());
        assertEquals("Geladeira", entity.getName());
        assertEquals("REFRIGERATION", entity.getApplianceCategory());
        assertEquals(new BigDecimal("150.00"), entity.getAveragePowerWatts());
        assertEquals(new BigDecimal("24.00"), entity.getAverageDailyUseHours());

        Appliance roundTripped = applianceMapper.toDomain(entity);

        assertEquals(appliance.getId(), roundTripped.getId());
        assertEquals(appliance.getName(), roundTripped.getName());
        assertEquals(appliance.getApplianceCategory(), roundTripped.getApplianceCategory());
        assertEquals(appliance.getAveragePowerWatts(), roundTripped.getAveragePowerWatts());
        assertEquals(appliance.getAverageDailyUseHours(), roundTripped.getAverageDailyUseHours());
    }

    @Test
    void shouldMapPropertyApplianceToEntityAndBack() {
        Appliance appliance =
                new Appliance(3L, "Geladeira", "REFRIGERATION", new BigDecimal("150.00"), new BigDecimal("24.00"));
        PropertyAppliance propertyAppliance = new PropertyAppliance(10L, appliance, 2);
        propertyAppliance.setId(50L);

        ApplianceEntity applianceEntity = applianceMapper.toEntity(appliance);
        PropertyApplianceEntity entity = propertyApplianceMapper.toEntity(propertyAppliance, applianceEntity);

        assertEquals(50L, entity.getId());
        assertEquals(10L, entity.getPropertyId());
        assertEquals(2, entity.getQuantity());
        assertEquals(3L, entity.getAppliance().getId());

        PropertyAppliance roundTripped = propertyApplianceMapper.toDomain(entity);

        assertEquals(propertyAppliance.getId(), roundTripped.getId());
        assertEquals(propertyAppliance.getPropertyId(), roundTripped.getPropertyId());
        assertEquals(propertyAppliance.getQuantity(), roundTripped.getQuantity());
        assertEquals("Geladeira", roundTripped.getAppliance().getName());
    }
}
