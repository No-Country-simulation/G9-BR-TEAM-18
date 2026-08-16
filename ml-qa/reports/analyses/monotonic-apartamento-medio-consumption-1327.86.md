# Análise: `monotonic/apartamento-medio/consumption=1327.86`

- **Grupo:** boundary
- **Conjunto:** apartamento-medio
- **Resultado:** ✅ aprovado
- **HTTP:** 200
- **Latência:** 250 ms

## Detalhamento por Equipamento

| Equipamento | Qtd | Potência (W) | Uso/dia (h) | kWh/mês |
|---|---|---|---|---|
| Split | 1 | 1200 | 8.0 | 288.0 |
| Geladeira | 1 | 150 | 24.0 | 108.0 |
| Chuveiro eletrico | 1 | 5500 | 0.5 | 82.5 |
| Air fryer | 1 | 1500 | 0.8 | 33.8 |
| Televisao | 1 | 150 | 6.0 | 27.0 |
| Videogame | 1 | 200 | 4.0 | 24.0 |
| Ventilador | 1 | 100 | 8.0 | 24.0 |
| Maquina de lavar | 1 | 500 | 1.5 | 22.5 |
| Micro-ondas | 1 | 1200 | 0.5 | 18.0 |
| Lampada | 8 | 12 | 6.0 | 17.3 |
| Notebook | 1 | 65 | 6.0 | 11.7 |
| Roteador | 1 | 10 | 24.0 | 7.2 |
| **Total** | | | | **663.9** |

## Payload enviado

```json
{
  "consumption_kwh": 1327.86,
  "peak_hour_usage": false,
  "equipment_quantity": 19,
  "property_type": "APARTAMENTO",
  "high_consumption_hours": 5.0,
  "daily_consumption_distribution": {
    "REFRIGERATION_WATTS": 150.0,
    "HEATING_WATTS": 8700.0,
    "AIR_CONDITIONING_WATTS": 1300.0,
    "LIGHTING_WATTS": 96.0
  },
  "highest_consumption_category": "APPLIANCES",
  "highest_consumption_products": [
    "Split",
    "Geladeira",
    "Chuveiro eletrico"
  ]
}
```

## Resposta do ML

| Campo | Valor |
|---|---|
| Categoria | BOM |
| Probabilidade | 0.7275 |
| Fonte | Modelo + Groq (falhou → regras) |

### Recomendações

- Prefira banhos mais curtos no chuveiro elétrico e use o micro-ondas ou a air fryer no lugar do forno tradicional sempre que possível.
- Com tantos equipamentos no imóvel, vale revisar quais realmente precisam ficar ligados ao mesmo tempo.
- Evitar banhos longos ou com o chuveiro elétrico na potência máxima.

## Verificações

- ✅ http_status: 200 conforme esperado
- ✅ response_schema: Campos obrigatórios presentes
- ✅ category_valid: Categoria BOM válida
- ✅ probability_range: Probabilidade 0.7275 válida
- ✅ recommendations: 3 recomendações válidas
- ✅ source_valid: Fonte model+rule-based (groq failed) (confidence 72.7%) reconhecida
- ✅ ordinal_consistency: Categoria BOM coerente

---
_Gerado automaticamente pelo módulo `ml-qa`._
