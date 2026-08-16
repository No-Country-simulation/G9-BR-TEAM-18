# Análise: `boundary/comercio-loja/hours=24`

- **Grupo:** boundary
- **Conjunto:** comercio-loja
- **Resultado:** ✅ aprovado
- **HTTP:** 200
- **Latência:** 161 ms

## Detalhamento por Equipamento

| Equipamento | Qtd | Potência (W) | Uso/dia (h) | kWh/mês |
|---|---|---|---|---|
| Ar-condicionado | 2 | 1500 | 8.0 | 720.0 |
| Geladeira | 2 | 150 | 24.0 | 216.0 |
| Computador | 2 | 150 | 8.0 | 72.0 |
| Bebedouro | 1 | 90 | 24.0 | 64.8 |
| Ventilador | 2 | 100 | 8.0 | 48.0 |
| Televisao | 1 | 150 | 6.0 | 27.0 |
| Lampada | 12 | 12 | 6.0 | 25.9 |
| Cafeteira | 1 | 800 | 0.2 | 6.0 |
| **Total** | | | | **1179.7** |

## Payload enviado

```json
{
  "consumption_kwh": 1179.72,
  "peak_hour_usage": false,
  "equipment_quantity": 23,
  "property_type": "COMERCIAL",
  "high_consumption_hours": 24.0,
  "daily_consumption_distribution": {
    "REFRIGERATION_WATTS": 390.0,
    "HEATING_WATTS": 800.0,
    "AIR_CONDITIONING_WATTS": 3200.0,
    "LIGHTING_WATTS": 144.0
  },
  "highest_consumption_category": "CLIMATE_CONTROL",
  "highest_consumption_products": [
    "Ar-condicionado",
    "Geladeira",
    "Computador"
  ]
}
```

## Resposta do ML

| Campo | Valor |
|---|---|
| Categoria | MEDIANO |
| Probabilidade | 0.9237 |
| Fonte | Modelo (confiança ≥ 80%) |

### Recomendações

- Ajuste o ar-condicionado para 23°C e evite deixar portas ou janelas abertas enquanto ele estiver ligado.
- Com tantos equipamentos no imóvel, vale revisar quais realmente precisam ficar ligados ao mesmo tempo.
- Tente distribuir o uso dos equipamentos ao longo do dia, em vez de concentrar tudo num único período de alto consumo.
- Reduzir o uso de ar-condicionado ou ajustar a temperatura para 23°C.

## Verificações

- ✅ http_status: 200 conforme esperado
- ✅ response_schema: Campos obrigatórios presentes
- ✅ category_valid: Categoria MEDIANO válida
- ✅ probability_range: Probabilidade 0.9237 válida
- ✅ recommendations: 4 recomendações válidas
- ✅ source_valid: Fonte model reconhecida
- ✅ ordinal_consistency: Categoria MEDIANO coerente

---
_Gerado automaticamente pelo módulo `ml-qa`._
