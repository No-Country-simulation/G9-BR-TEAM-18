# Análise: `combinatorial/45-comercio-restaurante-esperado-peak=true`

- **Grupo:** combinatorial
- **Conjunto:** comercio-restaurante
- **Resultado:** ✅ aprovado
- **HTTP:** 200
- **Latência:** 218 ms

## Detalhamento por Equipamento

| Equipamento | Qtd | Potência (W) | Uso/dia (h) | kWh/mês |
|---|---|---|---|---|
| Ar-condicionado | 1 | 1500 | 8.0 | 360.0 |
| Geladeira | 2 | 150 | 24.0 | 216.0 |
| Freezer | 1 | 200 | 24.0 | 144.0 |
| Bebedouro | 1 | 90 | 24.0 | 64.8 |
| Ventilador | 2 | 100 | 8.0 | 48.0 |
| Fogao | 1 | 1500 | 1.0 | 45.0 |
| Forno | 1 | 1500 | 0.8 | 33.8 |
| Lampada | 12 | 12 | 6.0 | 25.9 |
| Micro-ondas | 1 | 1200 | 0.5 | 18.0 |
| Cafeteira | 1 | 800 | 0.2 | 6.0 |
| Liquidificador | 1 | 500 | 0.2 | 3.8 |
| **Total** | | | | **965.2** |

## Payload enviado

```json
{
  "consumption_kwh": 965.22,
  "peak_hour_usage": true,
  "equipment_quantity": 24,
  "property_type": "COMERCIAL",
  "high_consumption_hours": 5.0,
  "daily_consumption_distribution": {
    "REFRIGERATION_WATTS": 590.0,
    "HEATING_WATTS": 5500.0,
    "AIR_CONDITIONING_WATTS": 1700.0,
    "LIGHTING_WATTS": 144.0
  },
  "highest_consumption_category": "APPLIANCES",
  "highest_consumption_products": [
    "Ar-condicionado",
    "Geladeira",
    "Freezer"
  ]
}
```

## Resposta do ML

| Campo | Valor |
|---|---|
| Categoria | CRITICO |
| Probabilidade | 0.5259 |
| Fonte | Modelo + Groq (falhou → regras) |

### Recomendações

- Evite usar equipamentos de maior potência entre 18h e 21h, esse é o horário de pico e costuma pesar mais na conta.
- Prefira banhos mais curtos no chuveiro elétrico e use o micro-ondas ou a air fryer no lugar do forno tradicional sempre que possível.
- Considere substituir os equipamentos mais antigos por modelos com melhor selo de eficiência energética.
- Com tantos equipamentos no imóvel, vale revisar quais realmente precisam ficar ligados ao mesmo tempo.
- Evitar banhos longos ou com o chuveiro elétrico na potência máxima.

## Verificações

- ✅ http_status: 200 conforme esperado
- ✅ response_schema: Campos obrigatórios presentes
- ✅ category_valid: Categoria CRITICO válida
- ✅ probability_range: Probabilidade 0.5259 válida
- ✅ recommendations: 5 recomendações válidas
- ✅ source_valid: Fonte model+rule-based (groq failed) (confidence 52.6%) reconhecida
- ✅ ordinal_consistency: Categoria CRITICO coerente

---
_Gerado automaticamente pelo módulo `ml-qa`._
