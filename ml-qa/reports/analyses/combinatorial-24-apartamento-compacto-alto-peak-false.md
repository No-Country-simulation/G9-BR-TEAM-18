# Análise: `combinatorial/24-apartamento-compacto-alto-peak=false`

- **Grupo:** combinatorial
- **Conjunto:** apartamento-compacto
- **Resultado:** ✅ aprovado
- **HTTP:** 200
- **Latência:** 234 ms

## Detalhamento por Equipamento

| Equipamento | Qtd | Potência (W) | Uso/dia (h) | kWh/mês |
|---|---|---|---|---|
| Geladeira | 1 | 150 | 24.0 | 108.0 |
| Chuveiro eletrico | 1 | 5500 | 0.5 | 82.5 |
| Televisao | 1 | 150 | 6.0 | 27.0 |
| Ventilador | 1 | 100 | 8.0 | 24.0 |
| Micro-ondas | 1 | 1200 | 0.5 | 18.0 |
| Notebook | 1 | 65 | 6.0 | 11.7 |
| Lampada | 4 | 12 | 6.0 | 8.6 |
| Roteador | 1 | 10 | 24.0 | 7.2 |
| **Total** | | | | **287.0** |

## Payload enviado

```json
{
  "consumption_kwh": 717.6,
  "peak_hour_usage": false,
  "equipment_quantity": 11,
  "property_type": "APARTAMENTO",
  "high_consumption_hours": 5.0,
  "daily_consumption_distribution": {
    "REFRIGERATION_WATTS": 150.0,
    "HEATING_WATTS": 6700.0,
    "AIR_CONDITIONING_WATTS": 100.0,
    "LIGHTING_WATTS": 48.0
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
| Categoria | EXCELENTE |
| Probabilidade | 0.7887 |
| Fonte | Modelo + Groq (falhou → regras) |

### Recomendações

- Prefira banhos mais curtos no chuveiro elétrico e use o micro-ondas ou a air fryer no lugar do forno tradicional sempre que possível.
- Com tantos equipamentos no imóvel, vale revisar quais realmente precisam ficar ligados ao mesmo tempo.
- Evitar banhos longos ou com o chuveiro elétrico na potência máxima.
- Continue mantendo essas boas práticas, seu consumo está bem equilibrado!

## Verificações

- ✅ http_status: 200 conforme esperado
- ✅ response_schema: Campos obrigatórios presentes
- ✅ category_valid: Categoria EXCELENTE válida
- ✅ probability_range: Probabilidade 0.7887 válida
- ✅ recommendations: 4 recomendações válidas
- ✅ source_valid: Fonte model+rule-based (groq failed) (confidence 78.9%) reconhecida
- ✅ ordinal_consistency: Categoria EXCELENTE coerente

---
_Gerado automaticamente pelo módulo `ml-qa`._
