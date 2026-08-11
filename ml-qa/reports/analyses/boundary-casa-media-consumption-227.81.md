# Análise: `boundary/casa-media/consumption=227.81`

- **Grupo:** boundary
- **Conjunto:** casa-media
- **Resultado:** ✅ aprovado
- **HTTP:** 200
- **Latência:** 285 ms

## Detalhamento por Equipamento

| Equipamento | Qtd | Potência (W) | Uso/dia (h) | kWh/mês |
|---|---|---|---|---|
| Ar-condicionado | 1 | 1500 | 8.0 | 360.0 |
| Freezer | 1 | 200 | 24.0 | 144.0 |
| Geladeira | 1 | 150 | 24.0 | 108.0 |
| Chuveiro eletrico | 1 | 5500 | 0.5 | 82.5 |
| Televisao | 2 | 150 | 6.0 | 54.0 |
| Air fryer | 1 | 1500 | 0.8 | 33.8 |
| Videogame | 1 | 200 | 4.0 | 24.0 |
| Ventilador | 1 | 100 | 8.0 | 24.0 |
| Maquina de lavar | 1 | 500 | 1.5 | 22.5 |
| Lampada | 10 | 12 | 6.0 | 21.6 |
| Micro-ondas | 1 | 1200 | 0.5 | 18.0 |
| Notebook | 1 | 65 | 6.0 | 11.7 |
| Roteador | 1 | 10 | 24.0 | 7.2 |
| **Total** | | | | **911.2** |

## Payload enviado

```json
{
  "consumption_kwh": 227.81,
  "peak_hour_usage": false,
  "equipment_quantity": 23,
  "property_type": "RESIDENCIAL",
  "high_consumption_hours": 5.0,
  "daily_consumption_distribution": {
    "REFRIGERATION_WATTS": 350.0,
    "HEATING_WATTS": 8700.0,
    "AIR_CONDITIONING_WATTS": 1600.0,
    "LIGHTING_WATTS": 120.0
  },
  "highest_consumption_category": "APPLIANCES",
  "highest_consumption_products": [
    "Ar-condicionado",
    "Freezer",
    "Geladeira"
  ]
}
```

## Resposta do ML

| Campo | Valor |
|---|---|
| Categoria | BOM |
| Probabilidade | 0.7722 |
| Fonte | Modelo + Groq (falhou → regras) |

### Recomendações

- Prefira banhos mais curtos no chuveiro elétrico e use o micro-ondas ou a air fryer no lugar do forno tradicional sempre que possível.
- Com tantos equipamentos no imóvel, vale revisar quais realmente precisam ficar ligados ao mesmo tempo.
- Evitar banhos longos ou com o chuveiro elétrico na potência máxima.

## Verificações

- ✅ http_status: 200 conforme esperado
- ✅ response_schema: Campos obrigatórios presentes
- ✅ category_valid: Categoria BOM válida
- ✅ probability_range: Probabilidade 0.7722 válida
- ✅ recommendations: 3 recomendações válidas
- ✅ source_valid: Fonte model+rule-based (groq failed) (confidence 77.2%) reconhecida
- ✅ ordinal_consistency: Categoria BOM coerente

---
_Gerado automaticamente pelo módulo `ml-qa`._
