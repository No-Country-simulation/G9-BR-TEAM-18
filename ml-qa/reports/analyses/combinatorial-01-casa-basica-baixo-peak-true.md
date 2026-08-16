# Análise: `combinatorial/01-casa-basica-baixo-peak=true`

- **Grupo:** combinatorial
- **Conjunto:** casa-basica
- **Resultado:** ✅ aprovado
- **HTTP:** 200
- **Latência:** 218 ms

## Detalhamento por Equipamento

| Equipamento | Qtd | Potência (W) | Uso/dia (h) | kWh/mês |
|---|---|---|---|---|
| Geladeira | 1 | 150 | 24.0 | 108.0 |
| Chuveiro eletrico | 1 | 5500 | 0.5 | 82.5 |
| Televisao | 1 | 150 | 6.0 | 27.0 |
| Ventilador | 1 | 100 | 8.0 | 24.0 |
| Micro-ondas | 1 | 1200 | 0.5 | 18.0 |
| Lampada | 6 | 12 | 6.0 | 13.0 |
| Roteador | 1 | 10 | 24.0 | 7.2 |
| **Total** | | | | **279.7** |

## Payload enviado

```json
{
  "consumption_kwh": 83.9,
  "peak_hour_usage": true,
  "equipment_quantity": 12,
  "property_type": "RESIDENCIAL",
  "high_consumption_hours": 5.0,
  "daily_consumption_distribution": {
    "REFRIGERATION_WATTS": 150.0,
    "HEATING_WATTS": 6700.0,
    "AIR_CONDITIONING_WATTS": 100.0,
    "LIGHTING_WATTS": 72.0
  },
  "highest_consumption_category": "APPLIANCES",
  "highest_consumption_products": [
    "Geladeira",
    "Chuveiro eletrico",
    "Televisao"
  ]
}
```

## Resposta do ML

| Campo | Valor |
|---|---|
| Categoria | CRITICO |
| Probabilidade | 0.8253 |
| Fonte | Modelo (confiança ≥ 80%) |

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
- ✅ probability_range: Probabilidade 0.8253 válida
- ✅ recommendations: 5 recomendações válidas
- ✅ source_valid: Fonte model reconhecida
- ✅ ordinal_consistency: Categoria CRITICO coerente

---
_Gerado automaticamente pelo módulo `ml-qa`._
