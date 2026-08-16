# Análise: `combinatorial/41-comercio-escritorio-alto-peak=true`

- **Grupo:** combinatorial
- **Conjunto:** comercio-escritorio
- **Resultado:** ✅ aprovado
- **HTTP:** 200
- **Latência:** 227 ms

## Detalhamento por Equipamento

| Equipamento | Qtd | Potência (W) | Uso/dia (h) | kWh/mês |
|---|---|---|---|---|
| Ar-condicionado | 2 | 1500 | 8.0 | 720.0 |
| Computador | 4 | 150 | 8.0 | 144.0 |
| Geladeira | 1 | 150 | 24.0 | 108.0 |
| Bebedouro | 1 | 90 | 24.0 | 64.8 |
| Notebook | 4 | 65 | 6.0 | 46.8 |
| Lampada | 16 | 12 | 6.0 | 34.6 |
| Roteador | 1 | 10 | 24.0 | 7.2 |
| Cafeteira | 1 | 800 | 0.2 | 6.0 |
| **Total** | | | | **1131.4** |

## Payload enviado

```json
{
  "consumption_kwh": 2828.4,
  "peak_hour_usage": true,
  "equipment_quantity": 30,
  "property_type": "COMERCIAL",
  "high_consumption_hours": 5.0,
  "daily_consumption_distribution": {
    "REFRIGERATION_WATTS": 240.0,
    "HEATING_WATTS": 800.0,
    "AIR_CONDITIONING_WATTS": 3000.0,
    "LIGHTING_WATTS": 192.0
  },
  "highest_consumption_category": "CLIMATE_CONTROL",
  "highest_consumption_products": [
    "Ar-condicionado",
    "Computador",
    "Geladeira"
  ]
}
```

## Resposta do ML

| Campo | Valor |
|---|---|
| Categoria | CRITICO |
| Probabilidade | 0.733 |
| Fonte | Modelo + Groq (falhou → regras) |

### Recomendações

- Evite usar equipamentos de maior potência entre 18h e 21h, esse é o horário de pico e costuma pesar mais na conta.
- Ajuste o ar-condicionado para 23°C e evite deixar portas ou janelas abertas enquanto ele estiver ligado.
- Considere substituir os equipamentos mais antigos por modelos com melhor selo de eficiência energética.
- Com tantos equipamentos no imóvel, vale revisar quais realmente precisam ficar ligados ao mesmo tempo.

## Verificações

- ✅ http_status: 200 conforme esperado
- ✅ response_schema: Campos obrigatórios presentes
- ✅ category_valid: Categoria CRITICO válida
- ✅ probability_range: Probabilidade 0.733 válida
- ✅ recommendations: 4 recomendações válidas
- ✅ source_valid: Fonte model+rule-based (groq failed) (confidence 73.3%) reconhecida
- ✅ ordinal_consistency: Categoria CRITICO coerente

---
_Gerado automaticamente pelo módulo `ml-qa`._
