import type { ApplianceItem, ApplianceType } from "../../types";

export interface ApplianceCalc {
  totalEquipment: number;
  monthlyConsumptionKwh: number;
  highestConsumptionCategory: string | undefined;
  highestConsumptionProducts: string[];
}

export function computeApplianceCalc(
  selectedAppliances: ApplianceItem[],
  applianceTypes: ApplianceType[],
): ApplianceCalc {
  if (selectedAppliances.length === 0) {
    return {
      totalEquipment: 0,
      monthlyConsumptionKwh: 0,
      highestConsumptionCategory: undefined,
      highestConsumptionProducts: [],
    };
  }
  const aggregated: Record<string, number> = {};
  let totalConsumption = 0;
  let totalQty = 0;
  const productConsumptions: { name: string; monthlyKwh: number }[] = [];
  for (const item of selectedAppliances) {
    const appliance = applianceTypes.find((t) => t.id === item.type);
    if (!appliance) continue;
    const dailyKwh = (appliance.powerWatts * appliance.dailyUsageHours * item.quantity) / 1000;
    const monthlyKwh = dailyKwh * 30;
    totalConsumption += monthlyKwh;
    totalQty += item.quantity;
    const totalW = appliance.powerWatts * item.quantity;
    const cat = appliance.mlCategory;
    aggregated[cat] = (aggregated[cat] ?? 0) + totalW;
    productConsumptions.push({ name: appliance.name, monthlyKwh });
  }
  productConsumptions.sort((a, b) => b.monthlyKwh - a.monthlyKwh);
  const topProducts = productConsumptions.slice(0, 3).map((p) => p.name);
  let highestCat = "Outros";
  let maxValue = -1;
  for (const [cat, val] of Object.entries(aggregated)) {
    if (val > maxValue) {
      maxValue = val;
      highestCat = cat;
    }
  }
  return {
    totalEquipment: totalQty,
    monthlyConsumptionKwh: totalConsumption,
    highestConsumptionCategory: highestCat,
    highestConsumptionProducts: topProducts,
  };
}
