# Análise: `boundary/comercio-loja/hours=0`

- **Grupo:** boundary
- **Conjunto:** comercio-loja
- **Resultado:** ❌ falhou
- **HTTP:** erro de conexão
- **Latência:** -

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
  "high_consumption_hours": 0.0,
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

_Sem resposta válida (status erro de conexão)._

## Verificações

- ❌ http_status: Sem resposta (erro de conexão)
- ✅ response_schema: Skipped: resposta sem corpo de predição
- ✅ category_valid: Skipped
- ✅ probability_range: Skipped
- ✅ recommendations: Skipped
- ✅ source_valid: Skipped
- ✅ ordinal_consistency: Skipped

---
_Gerado automaticamente pelo módulo `ml-qa`._
