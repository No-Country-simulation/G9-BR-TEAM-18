import type { ApplianceType } from "../types";

export const APPLIANCE_FALLBACK: ApplianceType[] = [
  {
    id: "REFRIGERATOR",
    name: "Geladeira",
    mlCategory: "Refrigeracao",
    distributionField: "REFRIGERATION_WATTS",
    powerWatts: 150,
    dailyUsageHours: 24,
    icon: "Snowflake",
  },

  {
    id: "AIR_CONDITIONER",
    name: "Ar-condicionado",
    mlCategory: "Climatizacao",
    distributionField: "AIR_CONDITIONING_WATTS",
    powerWatts: 1500,
    dailyUsageHours: 8,
    icon: "Wind",
  },
  {
    id: "FAN",
    name: "Ventilador",
    mlCategory: "Climatizacao",
    distributionField: "AIR_CONDITIONING_WATTS",
    powerWatts: 100,
    dailyUsageHours: 8,
    icon: "Wind",
  },

  {
    id: "ELECTRIC_SHOWER",
    name: "Chuveiro elétrico",
    mlCategory: "Eletrodomesticos",
    distributionField: "HEATING_WATTS",
    powerWatts: 5500,
    dailyUsageHours: 0.5,
    icon: "Home",
  },

  {
    id: "LAMP",
    name: "Lâmpada",
    mlCategory: "Iluminacao",
    distributionField: "LIGHTING_WATTS",
    powerWatts: 12,
    dailyUsageHours: 6,
    icon: "Lightbulb",
  },

  {
    id: "TV",
    name: "Televisão",
    mlCategory: "Tecnologia",
    distributionField: "NONE",
    powerWatts: 150,
    dailyUsageHours: 6,
    icon: "Monitor",
  },
  {
    id: "COMPUTER",
    name: "Computador",
    mlCategory: "Tecnologia",
    distributionField: "NONE",
    powerWatts: 150,
    dailyUsageHours: 8,
    icon: "Monitor",
  },
  {
    id: "VIDEO_GAME",
    name: "Videogame",
    mlCategory: "Tecnologia",
    distributionField: "NONE",
    powerWatts: 200,
    dailyUsageHours: 4,
    icon: "Monitor",
  },

  {
    id: "WASHING_MACHINE",
    name: "Máquina de lavar",
    mlCategory: "Eletrodomesticos",
    distributionField: "NONE",
    powerWatts: 500,
    dailyUsageHours: 1.5,
    icon: "Home",
  },
  {
    id: "MICROWAVE",
    name: "Micro-ondas",
    mlCategory: "Eletrodomesticos",
    distributionField: "NONE",
    powerWatts: 1200,
    dailyUsageHours: 0.5,
    icon: "Home",
  },
  {
    id: "AIR_FRYER",
    name: "Air fryer",
    mlCategory: "Eletrodomesticos",
    distributionField: "NONE",
    powerWatts: 1500,
    dailyUsageHours: 0.75,
    icon: "Home",
  },
];

export function mergeAppliancesWithBackend(
  fallback: ApplianceType[],
  backendData: Array<{
    id: number;
    name: string;
    appliance_category: string;
    average_power_watts: number;
    average_daily_use_hours: number;
  }>,
): ApplianceType[] {
  const backendByName = new Map<string, number>();
  for (const b of backendData) {
    backendByName.set(
      b.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, ""),
      b.id,
    );
  }
  return fallback.map((a) => {
    const key = a.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    const bid = backendByName.get(key);
    return bid ? { ...a, backendId: bid } : a;
  });
}
