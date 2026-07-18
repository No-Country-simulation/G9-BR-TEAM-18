import { useState, useEffect, useMemo, type FormEvent, type ReactElement } from "react";
import * as I from "lucide-react";
import type {
  AnalysisRequest,
  AnalysisResponse,
  ApplianceType,
  ApplianceItem,
  PropertyType,
} from "../types";
import {
  ApiError,
  CATEGORY_COLORS,
  CATEGORY_DISPLAY,
  HIGHEST_CONSUMPTION_CATEGORIES,
} from "../types";
import { analyzeEnergy, listApplianceTypes } from "../services/api";

const PROPERTY_TYPES: PropertyType[] = [
  "Casa",
  "Apartamento",
  "Comercial",
  "Industria",
  "Rural",
  "Outro",
];

const CATEGORIES: Record<string, { label: string; icone: string; cor: string }> = {
  Refrigeracao: { label: "Refrigeração", icone: "Snowflake", cor: "#0ea5e9" },
  Climatizacao: { label: "Climatização", icone: "Wind", cor: "#06b6d4" },
  Tecnologia: { label: "Tecnologia", icone: "Monitor", cor: "#8b5cf6" },
  Iluminacao: { label: "Iluminação", icone: "Lightbulb", cor: "#f59e0b" },
  Eletrodomesticos: { label: "Eletrodomésticos", icone: "Home", cor: "#ec4899" },
  Servicos: { label: "Serviços", icone: "Wrench", cor: "#14b8a6" },
  Outros: { label: "Outros", icone: "Box", cor: "#6b7280" },
};

const ORDEM_CATEGORIAS = [
  "Refrigeracao",
  "Climatizacao",
  "Tecnologia",
  "Iluminacao",
  "Eletrodomesticos",
  "Servicos",
  "Outros",
];

// Fallback local com todos os tipos de aparelho (funciona mesmo sem backend)
/** Retorna o componente Lucide correspondente ao nome do ícone */
function LucideIcon({
  name,
  size = 16,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}): ReactElement | null {
  const IconComponent = (
    I as unknown as Record<string, React.ComponentType<{ size?: number; className?: string }>>
  )[name];
  return IconComponent ? <IconComponent size={size} className={className} /> : null;
}

const APPLIANCE_FALLBACK: ApplianceType[] = [
  // ========== REFRIGERAÇÃO ==========
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
    id: "FREEZER",
    name: "Freezer",
    mlCategory: "Refrigeracao",
    distributionField: "REFRIGERATION_WATTS",
    powerWatts: 200,
    dailyUsageHours: 24,
    icon: "Snowflake",
  },
  {
    id: "FRIGOBAR",
    name: "Frigobar",
    mlCategory: "Refrigeracao",
    distributionField: "REFRIGERATION_WATTS",
    powerWatts: 80,
    dailyUsageHours: 24,
    icon: "Snowflake",
  },
  {
    id: "WATER_COOLER",
    name: "Bebedouro",
    mlCategory: "Refrigeracao",
    distributionField: "REFRIGERATION_WATTS",
    powerWatts: 100,
    dailyUsageHours: 12,
    icon: "Snowflake",
  },
  // ========== CLIMATIZAÇÃO ==========
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
    id: "SPLIT_AIR_CONDITIONER",
    name: "Ar-condicionado Split",
    mlCategory: "Climatizacao",
    distributionField: "AIR_CONDITIONING_WATTS",
    powerWatts: 1200,
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
    id: "CEILING_FAN",
    name: "Ventilador de teto",
    mlCategory: "Climatizacao",
    distributionField: "AIR_CONDITIONING_WATTS",
    powerWatts: 60,
    dailyUsageHours: 8,
    icon: "Wind",
  },
  {
    id: "ELECTRIC_HEATER",
    name: "Aquecedor elétrico",
    mlCategory: "Climatizacao",
    distributionField: "AIR_CONDITIONING_WATTS",
    powerWatts: 1500,
    dailyUsageHours: 4,
    icon: "Wind",
  },
  // ========== AQUECIMENTO ==========
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
    id: "ELECTRIC_FAUCET",
    name: "Torneira elétrica",
    mlCategory: "Eletrodomesticos",
    distributionField: "HEATING_WATTS",
    powerWatts: 3000,
    dailyUsageHours: 1,
    icon: "Home",
  },
  {
    id: "CENTRAL_HEATER",
    name: "Aquecedor central",
    mlCategory: "Servicos",
    distributionField: "HEATING_WATTS",
    powerWatts: 4000,
    dailyUsageHours: 4,
    icon: "Wrench",
  },
  {
    id: "BOILER",
    name: "Boiler elétrico",
    mlCategory: "Servicos",
    distributionField: "HEATING_WATTS",
    powerWatts: 2000,
    dailyUsageHours: 6,
    icon: "Wrench",
  },
  // ========== ILUMINAÇÃO ==========
  {
    id: "LED_BULB",
    name: "Lâmpada LED",
    mlCategory: "Iluminacao",
    distributionField: "LIGHTING_WATTS",
    powerWatts: 12,
    dailyUsageHours: 6,
    icon: "Lightbulb",
  },
  {
    id: "FLUORESCENT_BULB",
    name: "Lâmpada fluorescente",
    mlCategory: "Iluminacao",
    distributionField: "LIGHTING_WATTS",
    powerWatts: 30,
    dailyUsageHours: 6,
    icon: "Lightbulb",
  },
  {
    id: "INCANDESCENT_BULB",
    name: "Lâmpada incandescente",
    mlCategory: "Iluminacao",
    distributionField: "LIGHTING_WATTS",
    powerWatts: 60,
    dailyUsageHours: 6,
    icon: "Lightbulb",
  },
  {
    id: "CHANDELIER",
    name: "Lustre / luminária",
    mlCategory: "Iluminacao",
    distributionField: "LIGHTING_WATTS",
    powerWatts: 100,
    dailyUsageHours: 5,
    icon: "Lightbulb",
  },
  {
    id: "LAMP",
    name: "Abajur",
    mlCategory: "Iluminacao",
    distributionField: "LIGHTING_WATTS",
    powerWatts: 40,
    dailyUsageHours: 4,
    icon: "Lightbulb",
  },
  {
    id: "LED_SPOT",
    name: "Spot LED embutido",
    mlCategory: "Iluminacao",
    distributionField: "LIGHTING_WATTS",
    powerWatts: 8,
    dailyUsageHours: 6,
    icon: "Lightbulb",
  },
  // ========== TECNOLOGIA ==========
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
    id: "OLED_TV",
    name: "Televisão OLED",
    mlCategory: "Tecnologia",
    distributionField: "NONE",
    powerWatts: 200,
    dailyUsageHours: 6,
    icon: "Monitor",
  },
  {
    id: "DESKTOP_COMPUTER",
    name: "Computador desktop",
    mlCategory: "Tecnologia",
    distributionField: "NONE",
    powerWatts: 250,
    dailyUsageHours: 8,
    icon: "Monitor",
  },
  {
    id: "NOTEBOOK",
    name: "Notebook",
    mlCategory: "Tecnologia",
    distributionField: "NONE",
    powerWatts: 65,
    dailyUsageHours: 8,
    icon: "Monitor",
  },
  {
    id: "MONITOR",
    name: "Monitor",
    mlCategory: "Tecnologia",
    distributionField: "NONE",
    powerWatts: 50,
    dailyUsageHours: 8,
    icon: "Monitor",
  },
  {
    id: "ROUTER",
    name: "Roteador Wi-Fi",
    mlCategory: "Tecnologia",
    distributionField: "NONE",
    powerWatts: 15,
    dailyUsageHours: 24,
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
    id: "SPEAKER",
    name: "Caixa de som",
    mlCategory: "Tecnologia",
    distributionField: "NONE",
    powerWatts: 100,
    dailyUsageHours: 3,
    icon: "Monitor",
  },
  {
    id: "SOUNDBAR",
    name: "Soundbar",
    mlCategory: "Tecnologia",
    distributionField: "NONE",
    powerWatts: 80,
    dailyUsageHours: 4,
    icon: "Monitor",
  },
  {
    id: "CHARGER",
    name: "Carregador (smartphone/tablet)",
    mlCategory: "Tecnologia",
    distributionField: "NONE",
    powerWatts: 15,
    dailyUsageHours: 6,
    icon: "Monitor",
  },
  // ========== ELETRODOMÉSTICOS ==========
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
    id: "DRYER",
    name: "Secadora de roupas",
    mlCategory: "Eletrodomesticos",
    distributionField: "NONE",
    powerWatts: 3000,
    dailyUsageHours: 1,
    icon: "Home",
  },
  {
    id: "DISHWASHER",
    name: "Lava-louças",
    mlCategory: "Eletrodomesticos",
    distributionField: "NONE",
    powerWatts: 1500,
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
    id: "ELECTRIC_OVEN",
    name: "Forno elétrico",
    mlCategory: "Eletrodomesticos",
    distributionField: "NONE",
    powerWatts: 2000,
    dailyUsageHours: 1,
    icon: "Home",
  },
  {
    id: "ELECTRIC_STOVE",
    name: "Fogão elétrico",
    mlCategory: "Eletrodomesticos",
    distributionField: "NONE",
    powerWatts: 3000,
    dailyUsageHours: 1,
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
  {
    id: "COFFEE_MAKER",
    name: "Cafeteira elétrica",
    mlCategory: "Eletrodomesticos",
    distributionField: "NONE",
    powerWatts: 800,
    dailyUsageHours: 0.5,
    icon: "Home",
  },
  {
    id: "CLOTHES_IRON",
    name: "Ferro de passar",
    mlCategory: "Eletrodomesticos",
    distributionField: "NONE",
    powerWatts: 1000,
    dailyUsageHours: 1,
    icon: "Home",
  },
  {
    id: "VACUUM_CLEANER",
    name: "Aspirador de pó",
    mlCategory: "Eletrodomesticos",
    distributionField: "NONE",
    powerWatts: 1000,
    dailyUsageHours: 0.5,
    icon: "Home",
  },
  {
    id: "HAIR_DRYER",
    name: "Secador de cabelo",
    mlCategory: "Eletrodomesticos",
    distributionField: "NONE",
    powerWatts: 1500,
    dailyUsageHours: 0.25,
    icon: "Home",
  },
  {
    id: "BLENDER",
    name: "Liquidificador",
    mlCategory: "Eletrodomesticos",
    distributionField: "NONE",
    powerWatts: 400,
    dailyUsageHours: 0.25,
    icon: "Home",
  },
  {
    id: "MIXER",
    name: "Batedeira",
    mlCategory: "Eletrodomesticos",
    distributionField: "NONE",
    powerWatts: 300,
    dailyUsageHours: 0.5,
    icon: "Home",
  },
  {
    id: "EXHAUST_FAN",
    name: "Exaustor / coifa",
    mlCategory: "Eletrodomesticos",
    distributionField: "NONE",
    powerWatts: 250,
    dailyUsageHours: 2,
    icon: "Home",
  },
  {
    id: "SEWING_MACHINE",
    name: "Máquina de costura",
    mlCategory: "Eletrodomesticos",
    distributionField: "NONE",
    powerWatts: 100,
    dailyUsageHours: 2,
    icon: "Home",
  },
  // ========== SERVIÇOS ==========
  {
    id: "WATER_PUMP",
    name: "Bomba d'água",
    mlCategory: "Servicos",
    distributionField: "NONE",
    powerWatts: 500,
    dailyUsageHours: 4,
    icon: "Wrench",
  },
  {
    id: "ELECTRIC_GATE",
    name: "Portão elétrico",
    mlCategory: "Servicos",
    distributionField: "NONE",
    powerWatts: 250,
    dailyUsageHours: 0.5,
    icon: "Wrench",
  },
  {
    id: "INTERCOM",
    name: "Interfone / porteiro",
    mlCategory: "Servicos",
    distributionField: "NONE",
    powerWatts: 10,
    dailyUsageHours: 24,
    icon: "Wrench",
  },
  {
    id: "ELECTRIC_BARRIER",
    name: "Cancela elétrica",
    mlCategory: "Servicos",
    distributionField: "NONE",
    powerWatts: 500,
    dailyUsageHours: 0.5,
    icon: "Wrench",
  },
  {
    id: "POOL_PUMP",
    name: "Motor de piscina",
    mlCategory: "Servicos",
    distributionField: "NONE",
    powerWatts: 750,
    dailyUsageHours: 6,
    icon: "Wrench",
  },
  {
    id: "SECURITY_SYSTEM",
    name: "Sistema de segurança / CFTV",
    mlCategory: "Servicos",
    distributionField: "NONE",
    powerWatts: 50,
    dailyUsageHours: 24,
    icon: "Wrench",
  },
  {
    id: "MOTION_SENSOR",
    name: "Sensor de presença",
    mlCategory: "Servicos",
    distributionField: "NONE",
    powerWatts: 5,
    dailyUsageHours: 24,
    icon: "Wrench",
  },
  {
    id: "ELECTRIC_FENCE",
    name: "Cercas elétricas",
    mlCategory: "Servicos",
    distributionField: "NONE",
    powerWatts: 30,
    dailyUsageHours: 24,
    icon: "Wrench",
  },
  // ========== OUTROS ==========
  {
    id: "OTHER",
    name: "Outro aparelho",
    mlCategory: "Outros",
    distributionField: "NONE",
    powerWatts: 100,
    dailyUsageHours: 2,
    icon: "Box",
  },
];

const FIELD_NAMES: Record<string, string> = {
  consumption_kwh: "Consumo mensal (kWh)",
  property_type: "Tipo de imóvel",
  equipment_quantity: "Quantidade de equipamentos",
  high_consumption_hours: "Horas de alto consumo",
  peak_hour_usage: "Uso em horário de pico",
};

export default function AnalysisForm() {
  // --- Appliance types (fetch do backend) ---
  const [applianceTypes, setApplianceTypes] = useState<ApplianceType[]>([]);
  const [selectedAppliances, setSelectedAppliances] = useState<ApplianceItem[]>([]);
  const [openCategories, setOpenCategories] = useState<Set<string>>(
    new Set(["Refrigeracao", "Climatizacao", "Tecnologia"]),
  );
  const [showAdvanced, setShowAdvanced] = useState(false);

  // --- Form state (todos os campos do ML Service) ---
  const [form, setForm] = useState({
    property_type: "Casa" as PropertyType,
    consumption_kwh: 300,
    high_consumption_hours: 6,
    peak_hour_usage: false,
    // Avançados
    highest_consumption_category: "Outros" as string,
    refrigeration_watts: 0,
    heating_watts: 0,
    air_conditioning_watts: 0,
    lighting_watts: 0,
  });

  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(false);

  // Busca termo
  const [searchTerm, setSearchTerm] = useState("");

  // Carregar tipos de aparelho (com fallback local)
  useEffect(() => {
    listApplianceTypes()
      .then((data) => {
        if (data.length > 0) setApplianceTypes(data);
        else setApplianceTypes(APPLIANCE_FALLBACK);
      })
      .catch(() => setApplianceTypes(APPLIANCE_FALLBACK));
  }, []);

  // Aparelhos filtrados pela busca
  const filteredTypes = useMemo(() => {
    if (!searchTerm.trim()) return applianceTypes;
    const term = searchTerm
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    return applianceTypes.filter(
      (t) =>
        t.name
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .includes(term) || t.mlCategory.toLowerCase().includes(term),
    );
  }, [applianceTypes, searchTerm]);

  // --- Cálculo único e consolidado dos aparelhos selecionados ---
  const applianceCalc = useMemo(() => {
    if (selectedAppliances.length === 0) {
      return {
        totalEquipamentos: 0,
        consumoMensalKwh: 0,
        highestConsumptionCategory: "Outros",
        refrigerationWatts: 0,
        heatingWatts: 0,
        airConditioningWatts: 0,
        lightingWatts: 0,
      };
    }

    const agregado: Record<string, number> = {};
    let totalConsumo = 0;
    let totalQty = 0;

    for (const item of selectedAppliances) {
      const tipo = applianceTypes.find((t) => t.id === item.type);
      if (!tipo) continue;
      const dailyKwh = (tipo.powerWatts * tipo.dailyUsageHours * item.quantity) / 1000;
      totalConsumo += dailyKwh * 30;
      totalQty += item.quantity;
      const totalW = tipo.powerWatts * item.quantity;
      const cat = tipo.mlCategory;
      agregado[cat] = (agregado[cat] ?? 0) + totalW;
      if (tipo.distributionField !== "NONE") {
        const distKey = `dist_${tipo.distributionField}`;
        agregado[distKey] = (agregado[distKey] ?? 0) + totalW;
      }
    }

    // Categoria de maior consumo (sem acentos, consistente com o modelo ML)
    let maiorCat = "Outros";
    let maiorValor = -1;
    for (const [cat, val] of Object.entries(agregado)) {
      if (cat.startsWith("dist_")) continue;
      if (val > maiorValor) {
        maiorValor = val;
        maiorCat = cat;
      }
    }

    return {
      totalEquipamentos: totalQty,
      consumoMensalKwh: totalConsumo,
      highestConsumptionCategory: maiorCat,
      refrigerationWatts: agregado["dist_REFRIGERATION_WATTS"] ?? 0,
      heatingWatts: agregado["dist_HEATING_WATTS"] ?? 0,
      airConditioningWatts: agregado["dist_AIR_CONDITIONING_WATTS"] ?? 0,
      lightingWatts: agregado["dist_LIGHTING_WATTS"] ?? 0,
    };
  }, [selectedAppliances, applianceTypes]);

  // Sincroniza applianceCalc com o formulário (apenas quando aparelhos mudam)
  useEffect(() => {
    if (selectedAppliances.length === 0) return;
    const ac = applianceCalc;
    setForm((prev) => ({
      ...prev,
      consumption_kwh: Math.round(ac.consumoMensalKwh),
      highest_consumption_category: ac.highestConsumptionCategory,
      refrigeration_watts: ac.refrigerationWatts,
      heating_watts: ac.heatingWatts,
      air_conditioning_watts: ac.airConditioningWatts,
      lighting_watts: ac.lightingWatts,
    }));
  }, [selectedAppliances, applianceCalc]);

  // --- Handlers ---
  function toggleCategory(cat: string) {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  function addAppliance(id: string) {
    setSelectedAppliances((prev) => {
      const existente = prev.find((a) => a.type === id);
      if (existente) {
        return prev.map((a) => (a.type === id ? { ...a, quantity: a.quantity + 1 } : a));
      }
      return [...prev, { type: id, quantity: 1 }];
    });
  }

  function changeQuantity(type2: string, delta: number) {
    setSelectedAppliances((prev) =>
      prev
        .map((a) => (a.type === type2 ? { ...a, quantity: Math.max(1, a.quantity + delta) } : a))
        .filter((a) => a.quantity > 0),
    );
  }

  function removeAppliance(type2: string) {
    setSelectedAppliances((prev) => prev.filter((a) => a.type !== type2));
  }

  const appliancesByCategory = (cat: string) => filteredTypes.filter((t) => t.mlCategory === cat);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFieldErrors(null);
    setResult(null);

    try {
      // Monta o request com TODOS os campos do ML Service
      const request: AnalysisRequest = {
        property_type: form.property_type,
        high_consumption_hours: form.high_consumption_hours,
        peak_hour_usage: form.peak_hour_usage,
        // Quando há aparelhos, o backend recalcula tudo — fonte única de verdade
        appliances: selectedAppliances.length > 0 ? selectedAppliances : undefined,
        consumption_kwh: selectedAppliances.length > 0 ? undefined : form.consumption_kwh,
        equipment_quantity: undefined,
        highest_consumption_category:
          selectedAppliances.length > 0 ? undefined : form.highest_consumption_category,
        daily_consumption_distribution:
          selectedAppliances.length > 0
            ? undefined
            : {
                REFRIGERATION_WATTS: form.refrigeration_watts,
                HEATING_WATTS: form.heating_watts,
                AIR_CONDITIONING_WATTS: form.air_conditioning_watts,
                LIGHTING_WATTS: form.lighting_watts,
              },
      };
      const res = await analyzeEnergy(request);
      setResult(res);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        setFieldErrors(err.fields);
      } else {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="demo" className="demo-section">
      <div className="demo-container">
        <div className="demo-header">
          <h2>Análise Energética</h2>
          <p>
            Informe os dados do seu imóvel e adicione os aparelhos que você possui para uma análise
            precisa.
          </p>
        </div>

        <div className="demo-grid">
          <form onSubmit={handleSubmit} className="demo-form">
            {/* ============================================ */}
            {/* SEÇÃO 1: DADOS BÁSICOS                      */}
            {/* ============================================ */}
            <h3 className="section-title">Dados do Imóvel</h3>

            <div className="form-group">
              <label htmlFor="tipo">Tipo de imóvel</label>
              <select
                id="tipo"
                value={form.property_type}
                onChange={(e) =>
                  setForm({ ...form, property_type: e.target.value as PropertyType })
                }
              >
                {PROPERTY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="consumo">
                Consumo mensal (kWh)
                {selectedAppliances.length > 0 && <span className="auto-badge">auto</span>}
              </label>
              <input
                id="consumo"
                type="number"
                min="0"
                step="0.1"
                value={form.consumption_kwh}
                onChange={(e) => setForm({ ...form, consumption_kwh: +e.target.value })}
              />
              {selectedAppliances.length > 0 && (
                <small className="field-hint">
                  Calculado automaticamente dos aparelhos. Edite se souber o valor exato da conta.
                </small>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="horas">Horas de alto consumo por dia</label>
              <input
                id="horas"
                type="number"
                min="0"
                max="24"
                step="0.5"
                value={form.high_consumption_hours}
                onChange={(e) => setForm({ ...form, high_consumption_hours: +e.target.value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="pico" className="checkbox-label">
                <input
                  id="pico"
                  type="checkbox"
                  checked={form.peak_hour_usage}
                  onChange={(e) => setForm({ ...form, peak_hour_usage: e.target.checked })}
                />
                Uso em horário de pico (18h às 21h)
              </label>
            </div>

            {/* ============================================ */}
            {/* SEÇÃO 2: SEUS APARELHOS                      */}
            {/* ============================================ */}
            <h3 className="section-title">
              Seus Aparelhos
              {selectedAppliances.length > 0 && (
                <span className="appliance-count-badge">
                  {applianceCalc.totalEquipamentos} equip.
                </span>
              )}
            </h3>
            <p className="section-subtitle">
              Adicione exatamente quais aparelhos você possui e a quantidade de cada um.
            </p>

            {/* Busca */}
            <div className="appliance-search">
              <I.Search size={16} className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Buscar aparelho..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button type="button" className="search-clear" onClick={() => setSearchTerm("")}>
                  ✕
                </button>
              )}
            </div>

            {/* Catálogo */}
            <div className="appliance-catalog">
              {ORDEM_CATEGORIAS.map((cat) => {
                const catInfo = CATEGORIES[cat];
                const appliances = appliancesByCategory(cat);
                if (appliances.length === 0) return null;
                const isOpen = openCategories.has(cat);
                return (
                  <div key={cat} className="appliance-category">
                    <button
                      type="button"
                      className="appliance-category-header"
                      onClick={() => toggleCategory(cat)}
                      style={{ "--cat-color": catInfo.cor } as React.CSSProperties}
                    >
                      <span className="category-icon">
                        <LucideIcon name={catInfo.icone} size={18} />
                      </span>
                      <span className="category-label">{catInfo.label}</span>
                      <span className="category-count">{appliances.length}</span>
                      {isOpen ? <I.ChevronDown size={16} /> : <I.ChevronRight size={16} />}
                    </button>
                    {isOpen && (
                      <div className="appliance-grid">
                        {appliances.map((t) => {
                          const selected = selectedAppliances.find((s) => s.type === t.id);
                          return (
                            <button
                              key={t.id}
                              type="button"
                              className={`appliance-card ${selected ? "selected" : ""}`}
                              onClick={() => !selected && addAppliance(t.id)}
                              title={`${t.name} - ${t.powerWatts}W, ~${t.dailyUsageHours}h/dia`}
                            >
                              <LucideIcon name={t.icon} size={22} className="appliance-card-icon" />
                              <span className="appliance-card-name">{t.name}</span>
                              <span className="appliance-card-watts">{t.powerWatts}W</span>
                              {selected && (
                                <span className="appliance-card-qty">{selected.quantity}x</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Lista de selecionados */}
            {selectedAppliances.length > 0 ? (
              <div className="selected-appliances">
                <h4>Aparelhos adicionados</h4>
                <div className="selected-appliances-list">
                  {selectedAppliances.map((item) => {
                    const info = applianceTypes.find((t) => t.id === item.type);
                    if (!info) return null;
                    return (
                      <div key={item.type} className="selected-appliance-item">
                        <LucideIcon name={info.icon} size={16} className="selected-icon" />
                        <span className="selected-name">{info.name}</span>
                        <div className="selected-qty-controls">
                          <button
                            type="button"
                            className="qty-btn"
                            onClick={() => changeQuantity(item.type, -1)}
                            disabled={item.quantity <= 1}
                          >
                            <I.Minus size={14} />
                          </button>
                          <span className="qty-value">{item.quantity}</span>
                          <button
                            type="button"
                            className="qty-btn"
                            onClick={() => changeQuantity(item.type, 1)}
                          >
                            <I.Plus size={14} />
                          </button>
                        </div>
                        <button
                          type="button"
                          className="remove-btn"
                          onClick={() => removeAppliance(item.type)}
                        >
                          <I.Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
                {/* Resumo */}
                <div className="appliance-summary">
                  <div className="summary-stat">
                    <span className="summary-label">Equipamentos</span>
                    <span className="summary-value">{applianceCalc.totalEquipamentos}</span>
                  </div>
                  <div className="summary-stat">
                    <span className="summary-label">Consumo estimado</span>
                    <span className="summary-value">
                      {applianceCalc.consumoMensalKwh.toFixed(0)} kWh/mês
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="appliance-empty-hint">
                Clique nos aparelhos acima para adicioná-los. Quanto mais específico, mais precisa a
                análise.
              </p>
            )}

            {/* ============================================ */}
            {/* SEÇÃO 3: DADOS AVANÇADOS ML                  */}
            {/* ============================================ */}
            <div className="advanced-section">
              <button
                type="button"
                className="advanced-toggle"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                <I.Settings size={16} />
                {showAdvanced ? "Ocultar dados avançados" : "Mostrar dados avançados"}
                {showAdvanced ? <I.ChevronDown size={16} /> : <I.ChevronRight size={16} />}
              </button>

              {showAdvanced && (
                <div className="advanced-content">
                  <p className="field-hint" style={{ marginBottom: "1rem" }}>
                    Campos compatíveis com o modelo de IA. Normalmente preenchidos automaticamente
                    quando você adiciona aparelhos.
                  </p>

                  <div className="form-group">
                    <label htmlFor="catMaior">
                      Categoria de maior consumo
                      {selectedAppliances.length > 0 && <span className="auto-badge">auto</span>}
                    </label>
                    <select
                      id="catMaior"
                      value={form.highest_consumption_category}
                      onChange={(e) =>
                        setForm({ ...form, highest_consumption_category: e.target.value })
                      }
                    >
                      {HIGHEST_CONSUMPTION_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="dist-grid">
                    <div className="form-group">
                      <label htmlFor="refrigW">
                        Potência Refrigeração (W)
                        {selectedAppliances.length > 0 && <span className="auto-badge">auto</span>}
                      </label>
                      <input
                        id="refrigW"
                        type="number"
                        min="0"
                        value={form.refrigeration_watts}
                        onChange={(e) => setForm({ ...form, refrigeration_watts: +e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="aquecW">
                        Potência Aquecimento (W)
                        {selectedAppliances.length > 0 && <span className="auto-badge">auto</span>}
                      </label>
                      <input
                        id="aquecW"
                        type="number"
                        min="0"
                        value={form.heating_watts}
                        onChange={(e) => setForm({ ...form, heating_watts: +e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="climatW">
                        Potência Climatização (W)
                        {selectedAppliances.length > 0 && <span className="auto-badge">auto</span>}
                      </label>
                      <input
                        id="climatW"
                        type="number"
                        min="0"
                        value={form.air_conditioning_watts}
                        onChange={(e) =>
                          setForm({ ...form, air_conditioning_watts: +e.target.value })
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="ilumW">
                        Potência Iluminação (W)
                        {selectedAppliances.length > 0 && <span className="auto-badge">auto</span>}
                      </label>
                      <input
                        id="ilumW"
                        type="number"
                        min="0"
                        value={form.lighting_watts}
                        onChange={(e) => setForm({ ...form, lighting_watts: +e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? (
                "Analisando..."
              ) : (
                <>
                  <I.BarChart3 size={18} />
                  Analisar Consumo
                </>
              )}
            </button>
          </form>

          {/* ============================================ */}
          {/* RESULTADO                                     */}
          {/* ============================================ */}
          <div className="demo-result">
            {loading && (
              <div className="result-placeholder">
                <div className="spinner" />
                <p>Processando sua análise...</p>
              </div>
            )}

            {error && !loading && (
              <div className="result-error">
                <p className="error-title">{error}</p>
                {fieldErrors && Object.keys(fieldErrors).length > 0 && (
                  <ul className="error-fields">
                    {Object.entries(fieldErrors).map(([field, msg]) => (
                      <li key={field}>
                        <strong>{FIELD_NAMES[field] ?? field}:</strong> {msg}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {result && !loading && (
              <div className="result-card">
                <div
                  className="result-badge"
                  style={{ backgroundColor: CATEGORY_COLORS[result.category] ?? "#6b7280" }}
                >
                  {CATEGORY_DISPLAY[result.category] ?? result.category}
                </div>

                <div className="result-stats">
                  <div className="stat">
                    <span className="stat-label">Confiança</span>
                    <span className="stat-value">{(result.probability * 100).toFixed(0)}%</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Custo Estimado</span>
                    <span className="stat-value">
                      R$ {result.estimated_monthly_cost.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="result-recs">
                  <h4>Recomendações</h4>
                  <ul>
                    {result.recommendations.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                  {result.source && <p className="result-origem">Origem: {result.source}</p>}
                </div>
              </div>
            )}

            {!result && !error && !loading && (
              <div className="result-placeholder">
                <I.BarChart3 size={48} className="placeholder-icon" />
                <p>Preencha os dados e clique em "Analisar Consumo" para ver o resultado.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
