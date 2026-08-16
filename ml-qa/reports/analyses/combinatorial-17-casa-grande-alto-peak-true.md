# Análise: `combinatorial/17-casa-grande-alto-peak=true`

- **Grupo:** combinatorial
- **Conjunto:** casa-grande
- **Resultado:** ✅ aprovado
- **HTTP:** 200
- **Latência:** 137 ms

## Detalhamento por Equipamento

| Equipamento | Qtd | Potência (W) | Uso/dia (h) | kWh/mês |
|---|---|---|---|---|
| Ar-condicionado | 2 | 1500 | 8.0 | 720.0 |
| Geladeira | 2 | 150 | 24.0 | 216.0 |
| Chuveiro eletrico | 2 | 5500 | 0.5 | 165.0 |
| Freezer | 1 | 200 | 24.0 | 144.0 |
| Motor de piscina | 1 | 750 | 4.0 | 90.0 |
| Secadora | 1 | 2500 | 1.0 | 75.0 |
| Computador | 2 | 150 | 8.0 | 72.0 |
| Televisao | 2 | 150 | 6.0 | 54.0 |
| Ventilador | 2 | 100 | 8.0 | 48.0 |
| Lampada | 16 | 12 | 6.0 | 34.6 |
| Forno | 1 | 1500 | 0.8 | 33.8 |
| Air fryer | 1 | 1500 | 0.8 | 33.8 |
| Videogame | 1 | 200 | 4.0 | 24.0 |
| Notebook | 2 | 65 | 6.0 | 23.4 |
| Maquina de lavar | 1 | 500 | 1.5 | 22.5 |
| Bomba d'agua | 1 | 750 | 1.0 | 22.5 |
| Micro-ondas | 1 | 1200 | 0.5 | 18.0 |
| Roteador | 1 | 10 | 24.0 | 7.2 |
| Portao eletrico | 1 | 250 | 0.2 | 1.9 |
| **Total** | | | | **1805.5** |

## Payload enviado

```json
{
  "consumption_kwh": 4513.85,
  "peak_hour_usage": true,
  "equipment_quantity": 41,
  "property_type": "RESIDENCIAL",
  "high_consumption_hours": 5.0,
  "daily_consumption_distribution": {
    "REFRIGERATION_WATTS": 500.0,
    "HEATING_WATTS": 18200.0,
    "AIR_CONDITIONING_WATTS": 3200.0,
    "LIGHTING_WATTS": 192.0
  },
  "highest_consumption_category": "APPLIANCES",
  "highest_consumption_products": [
    "Ar-condicionado",
    "Geladeira",
    "Chuveiro eletrico"
  ]
}
```

## Resposta do ML

| Campo | Valor |
|---|---|
| Categoria | CRITICO |
| Probabilidade | 0.8026 |
| Fonte | Modelo (confiança ≥ 80%) |

### Recomendações

- Evite usar equipamentos de maior potência entre 18h e 21h, esse é o horário de pico e costuma pesar mais na conta.
- Prefira banhos mais curtos no chuveiro elétrico e use o micro-ondas ou a air fryer no lugar do forno tradicional sempre que possível.
- Considere substituir os equipamentos mais antigos por modelos com melhor selo de eficiência energética.
- Com tantos equipamentos no imóvel, vale revisar quais realmente precisam ficar ligados ao mesmo tempo.
- Reduzir o uso de ar-condicionado ou ajustar a temperatura para 23°C.
- Evitar banhos longos ou com o chuveiro elétrico na potência máxima.

## Verificações

- ✅ http_status: 200 conforme esperado
- ✅ response_schema: Campos obrigatórios presentes
- ✅ category_valid: Categoria CRITICO válida
- ✅ probability_range: Probabilidade 0.8026 válida
- ✅ recommendations: 6 recomendações válidas
- ✅ source_valid: Fonte model reconhecida
- ✅ ordinal_consistency: Categoria CRITICO coerente

---
_Gerado automaticamente pelo módulo `ml-qa`._
