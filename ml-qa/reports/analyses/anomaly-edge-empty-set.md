# Análise: `anomaly/edge/empty-set`

- **Grupo:** anomalies
- **Conjunto:** imovel-vazio
- **Resultado:** ✅ aprovado
- **HTTP:** 200
- **Latência:** 251 ms

## Detalhamento por Equipamento

_Nenhum equipamento no conjunto (imóvel sem aparelhos registrados)._

## Payload enviado

```json
{
  "consumption_kwh": 911.25,
  "peak_hour_usage": false,
  "equipment_quantity": 0,
  "property_type": "RESIDENCIAL",
  "high_consumption_hours": 5.0,
  "daily_consumption_distribution": {
    "REFRIGERATION_WATTS": 0.0,
    "HEATING_WATTS": 0.0,
    "AIR_CONDITIONING_WATTS": 0.0,
    "LIGHTING_WATTS": 0.0
  }
}
```

## Resposta do ML

| Campo | Valor |
|---|---|
| Categoria | EXCELENTE |
| Probabilidade | 0.9928 |
| Fonte | Modelo (confiança ≥ 80%) |

### Recomendações

- Continue mantendo essas boas práticas, seu consumo está bem equilibrado!

## Verificações

- ✅ http_status: 200 conforme esperado
- ✅ response_schema: Campos obrigatórios presentes
- ✅ category_valid: Categoria EXCELENTE válida
- ✅ probability_range: Probabilidade 0.9928 válida
- ✅ recommendations: 1 recomendações válidas
- ✅ source_valid: Fonte model reconhecida
- ✅ ordinal_consistency: Skipped: anomalia semântica

---
_Gerado automaticamente pelo módulo `ml-qa`._
