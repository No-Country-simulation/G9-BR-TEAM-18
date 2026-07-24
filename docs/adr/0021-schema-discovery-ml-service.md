# ADR-0021: Schema Discovery Dinâmico para Contrato ML

## Status

Aceito

## Contexto

As categorias de eficiência energética (`EXCELENTE`, `BOM`, `MEDIANO`,
`RUIM`, `CRITICO`) e os campos de distribuição de consumo
(`REFRIGERATION_WATTS`, `HEATING_WATTS`, `AIR_CONDITIONING_WATTS`,
`LIGHTING_WATTS`) estão hardcoded em três camadas da aplicação:

- **ML Service:** dentro da lógica de classificação em Python
- **Backend:** validação em `EnergyAnalysisService.normalizeCategory()`
  e no mapper de distribuição
- **Frontend:** tipos TypeScript em `types/index.ts` e componentes de UI

Isso significa que qualquer alteração nessas categorias ou campos de
distribuição exige mudanças coordenadas nas três camadas, com risco de
dessincronização.

## Decisão

Decidimos implementar um mecanismo de descoberta dinâmica de contrato
(Schema Discovery), onde o ML Service expõe endpoints que descrevem seu
próprio esquema, e as camadas consumidoras (backend e frontend) se
adaptam dinamicamente.

### 1. ML Service: Endpoints de Schema

Adicionar dois endpoints no ML Service (Python/FastAPI):

```python
@app.get("/predict-schema")
def predict_schema():
    """Retorna o schema JSON do PredictRequest para descoberta
    dinâmica pelo backend."""
    return PredictRequest.model_json_schema()


@app.get("/categories")
def categories():
    """Retorna a lista de categorias de eficiência válidas."""
    return {
        "categories": ["EXCELENTE", "BOM", "MEDIANO", "RUIM", "CRITICO"]
    }
```

### 2. Backend: Schema Discovery no Startup

No startup da aplicação Spring Boot, o backend consulta o ML Service para
obter:

- **Schema do request:** usado para validar se os campos que o backend
  envia ainda são compatíveis com o que o ML espera.
- **Lista de categorias:** usada para configurar dinamicamente as regras
  de validação no `EnergyAnalysisService`, eliminando o array fixo.

```java
@Component
public class MlSchemaDiscovery implements ApplicationRunner {
    public void run(ApplicationArguments args) {
        JsonSchema schema = mlClient.fetchSchema();
        List<String> categories = mlClient.fetchCategories();
        mlSchemaRegistry.register(schema, categories);
    }
}
```

Se a descoberta falhar (ML Service indisponível no startup), o backend
usa valores default configurados em properties como fallback.

### 3. Backend: Endpoint de Categorias para o Frontend

Criar um endpoint no backend que repassa as categorias obtidas do ML para
o frontend:

```java
@GetMapping("/energy-analysis/categories")
public ResponseEntity<List<String>> getCategories() {
    return ResponseEntity.ok(mlSchemaRegistry.getCategories());
}
```

### 4. Frontend: Consumo Dinâmico de Categorias

O frontend passa a buscar as categorias do backend em vez de tê-las
hardcoded:

```typescript
// Em vez de:
// type EfficiencyClassification = "EXCELENTE" | "BOM" | "MEDIANO" | "RUIM" | "CRITICO";

// Busca dinamicamente:
const categories: string[] = await fetch("/energy-analysis/categories").then(r => r.json());
```

## Alternativas consideradas

| Alternativa | Prós | Contras |
|---|---|---|
| **Schema Discovery (escolhido)** | Backend e frontend se adaptam automaticamente; zero hardcoded | ML Service precisa estar acessível no startup; fallback necessário |
| **Manter hardcoded com documentação** | Simples | Não resolve o problema de dessincronização |
| **Schema Registry centralizado (Apicurio/Confluent)** | Solução robusta para múltiplos serviços | Overkill para 3 serviços; infra adicional |

## Consequências

- **Positivo:** Categorias e schema são descobertos dinamicamente,
  eliminando valores hardcoded nas 3 camadas.
- **Positivo:** Qualquer alteração no ML Service é refletida
  automaticamente após o restart do backend.
- **Positivo:** O endpoint `/energy-analysis/categories` permite que o
  frontend renderize categorias sem conhecimento prévio.
- **Negativo:** O backend precisa de fallback para quando o ML Service
  estiver indisponível no startup.
- **Negativo:** A latência de startup pode aumentar ligeiramente (1
  chamada HTTP ao ML).
