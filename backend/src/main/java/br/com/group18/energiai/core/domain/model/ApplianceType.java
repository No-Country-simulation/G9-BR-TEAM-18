package br.com.group18.energiai.core.domain.model;

public enum ApplianceType {
    LAMPS(EquipmentCategory.LIGHTING),
    REFRIGERATOR(EquipmentCategory.REFRIGERATION),
    FAN(EquipmentCategory.CLIMATE_CONTROL),
    AIR_CONDITIONER(EquipmentCategory.CLIMATE_CONTROL),
    MICROWAVE(EquipmentCategory.APPLIANCES),
    AIR_FRYER(EquipmentCategory.APPLIANCES),
    WASHING_MACHINE(EquipmentCategory.APPLIANCES),
    DRYER(EquipmentCategory.APPLIANCES),
    ELECTRIC_SHOWER(EquipmentCategory.APPLIANCES),
    COMPUTERS(EquipmentCategory.TECHNOLOGY),
    VIDEO_GAME(EquipmentCategory.TECHNOLOGY),
    TV(EquipmentCategory.TECHNOLOGY),
    WATER_PUMP(EquipmentCategory.SERVICES),
    ELECTRIC_GATE(EquipmentCategory.SERVICES),
    POOL_MOTOR(EquipmentCategory.SERVICES);

    private final EquipmentCategory category;

    ApplianceType(EquipmentCategory category) {
        this.category = category;
    }

    public EquipmentCategory getCategory() {
        return category;
    }
}
