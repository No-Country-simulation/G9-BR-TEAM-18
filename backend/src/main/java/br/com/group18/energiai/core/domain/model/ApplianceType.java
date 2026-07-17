package br.com.group18.energiai.core.domain.model;

import java.util.List;

/**
 * Enum of common electrical appliances mapped to ML Service categories. Each appliance has: -
 * displayName: human-readable name in Portuguese - mlCategory: category for the
 * highest_consumption_category field (7 categories) - distributionField: field in
 * daily_consumption_distribution (4 fields) or NONE - powerWatts: typical power in watts -
 * dailyUsageHours: average hours of use per day
 */
public enum ApplianceType {

    // ========== REFRIGERATION ==========
    REFRIGERATOR("Geladeira", "Refrigeracao", "REFRIGERATION_WATTS", 150, 24),
    FREEZER("Freezer", "Refrigeracao", "REFRIGERATION_WATTS", 200, 24),
    FRIGOBAR("Frigobar", "Refrigeracao", "REFRIGERATION_WATTS", 80, 24),
    WATER_COOLER("Bebedouro", "Refrigeracao", "REFRIGERATION_WATTS", 100, 12),

    // ========== AIR CONDITIONING ==========
    AIR_CONDITIONER("Ar-condicionado", "Climatizacao", "AIR_CONDITIONING_WATTS", 1500, 8),
    SPLIT_AIR_CONDITIONER("Ar-condicionado Split", "Climatizacao", "AIR_CONDITIONING_WATTS", 1200, 8),
    FAN("Ventilador", "Climatizacao", "AIR_CONDITIONING_WATTS", 100, 8),
    CEILING_FAN("Ventilador de teto", "Climatizacao", "AIR_CONDITIONING_WATTS", 60, 8),
    ELECTRIC_HEATER("Aquecedor elétrico", "Climatizacao", "AIR_CONDITIONING_WATTS", 1500, 4),

    // ========== HEATING ==========
    ELECTRIC_SHOWER("Chuveiro elétrico", "Eletrodomesticos", "HEATING_WATTS", 5500, 0.5),
    ELECTRIC_FAUCET("Torneira elétrica", "Eletrodomesticos", "HEATING_WATTS", 3000, 1),
    CENTRAL_HEATER("Aquecedor central", "Servicos", "HEATING_WATTS", 4000, 4),
    BOILER("Boiler elétrico", "Servicos", "HEATING_WATTS", 2000, 6),

    // ========== LIGHTING ==========
    LED_BULB("Lâmpada LED", "Iluminacao", "LIGHTING_WATTS", 12, 6),
    FLUORESCENT_BULB("Lâmpada fluorescente", "Iluminacao", "LIGHTING_WATTS", 30, 6),
    INCANDESCENT_BULB("Lâmpada incandescente", "Iluminacao", "LIGHTING_WATTS", 60, 6),
    CHANDELIER("Lustre / luminária", "Iluminacao", "LIGHTING_WATTS", 100, 5),
    LAMP("Abajur", "Iluminacao", "LIGHTING_WATTS", 40, 4),
    LED_SPOT("Spot LED embutido", "Iluminacao", "LIGHTING_WATTS", 8, 6),

    // ========== TECHNOLOGY ==========
    TV("Televisão", "Tecnologia", "NONE", 150, 6),
    OLED_TV("Televisão OLED", "Tecnologia", "NONE", 200, 6),
    DESKTOP_COMPUTER("Computador desktop", "Tecnologia", "NONE", 250, 8),
    NOTEBOOK("Notebook", "Tecnologia", "NONE", 65, 8),
    MONITOR("Monitor", "Tecnologia", "NONE", 50, 8),
    ROUTER("Roteador Wi-Fi", "Tecnologia", "NONE", 15, 24),
    VIDEO_GAME("Videogame", "Tecnologia", "NONE", 200, 4),
    SPEAKER("Caixa de som", "Tecnologia", "NONE", 100, 3),
    SOUNDBAR("Soundbar", "Tecnologia", "NONE", 80, 4),
    CHARGER("Carregador (smartphone/tablet)", "Tecnologia", "NONE", 15, 6),

    // ========== APPLIANCES ==========
    WASHING_MACHINE("Máquina de lavar", "Eletrodomesticos", "NONE", 500, 1.5),
    DRYER("Secadora de roupas", "Eletrodomesticos", "NONE", 3000, 1),
    DISHWASHER("Lava-louças", "Eletrodomesticos", "NONE", 1500, 1.5),
    MICROWAVE("Micro-ondas", "Eletrodomesticos", "NONE", 1200, 0.5),
    ELECTRIC_OVEN("Forno elétrico", "Eletrodomesticos", "NONE", 2000, 1),
    ELECTRIC_STOVE("Fogão elétrico", "Eletrodomesticos", "NONE", 3000, 1),
    AIR_FRYER("Air fryer", "Eletrodomesticos", "NONE", 1500, 0.75),
    COFFEE_MAKER("Cafeteira elétrica", "Eletrodomesticos", "NONE", 800, 0.5),
    CLOTHES_IRON("Ferro de passar", "Eletrodomesticos", "NONE", 1000, 1),
    VACUUM_CLEANER("Aspirador de pó", "Eletrodomesticos", "NONE", 1000, 0.5),
    HAIR_DRYER("Secador de cabelo", "Eletrodomesticos", "NONE", 1500, 0.25),
    BLENDER("Liquidificador", "Eletrodomesticos", "NONE", 400, 0.25),
    MIXER("Batedeira", "Eletrodomesticos", "NONE", 300, 0.5),
    EXHAUST_FAN("Exaustor / coifa", "Eletrodomesticos", "NONE", 250, 2),
    SEWING_MACHINE("Máquina de costura", "Eletrodomesticos", "NONE", 100, 2),

    // ========== SERVICES ==========
    WATER_PUMP("Bomba d'água", "Servicos", "NONE", 500, 4),
    ELECTRIC_GATE("Portão elétrico", "Servicos", "NONE", 250, 0.5),
    INTERCOM("Interfone / porteiro", "Servicos", "NONE", 10, 24),
    ELECTRIC_BARRIER("Cancela elétrica", "Servicos", "NONE", 500, 0.5),
    POOL_PUMP("Motor de piscina", "Servicos", "NONE", 750, 6),
    SECURITY_SYSTEM("Sistema de segurança / CFTV", "Servicos", "NONE", 50, 24),
    MOTION_SENSOR("Sensor de presença", "Servicos", "NONE", 5, 24),
    ELECTRIC_FENCE("Cercas elétricas", "Servicos", "NONE", 30, 24),

    // ========== OTHER ==========
    OTHER("Outro aparelho", "Outros", "NONE", 100, 2),
    ;

    private final String displayName;
    private final String mlCategory;
    private final String distributionField;
    private final double powerWatts;
    private final double dailyUsageHours;

    ApplianceType(
            String displayName,
            String mlCategory,
            String distributionField,
            double powerWatts,
            double dailyUsageHours) {
        this.displayName = displayName;
        this.mlCategory = mlCategory;
        this.distributionField = distributionField;
        this.powerWatts = powerWatts;
        this.dailyUsageHours = dailyUsageHours;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getMlCategory() {
        return mlCategory;
    }

    public String getDistributionField() {
        return distributionField;
    }

    public double getPowerWatts() {
        return powerWatts;
    }

    public double getDailyUsageHours() {
        return dailyUsageHours;
    }

    /** All distinct categories for the ML Service */
    public static List<String> getMlCategories() {
        return List.of(
                "Refrigeracao", "Climatizacao", "Tecnologia", "Iluminacao", "Eletrodomesticos", "Servicos", "Outros");
    }

    /** Power distribution fields */
    public static List<String> getDistributionFields() {
        return List.of("REFRIGERATION_WATTS", "HEATING_WATTS", "AIR_CONDITIONING_WATTS", "LIGHTING_WATTS");
    }
}
