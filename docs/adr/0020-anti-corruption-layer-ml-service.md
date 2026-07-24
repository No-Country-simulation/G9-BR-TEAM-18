# ADR-0020: Anti-Corruption Layer para Integração com ML Service

## Status

Aceito

## Contexto

Atualmente, o backend possui o record `MlPredictResponse` em
`MlServiceClient.java` que espelha exatamente a estrutura do
`PredictResponse` do ML Service (Python/FastAPI). Qualquer alteração no
ML Service -- adição, remoção ou renomeação de campos -- exige alteração
manual no Java, no DTO de resposta (`AnalysisResponseDTO`) e,
frequentemente, no frontend.

Esse acoplamento direto viola o princípio de segregação de interfaces e
torna a arquitetura frágil: uma mudança simples no ML Service pode causar
erros em tempo de execução (runtime) no backend se os records não forem
atualizados simultaneamente.

O mesmo ocorre com o request: `MlPredictRequest` e
`DailyConsumptionDistribution` espelham exatamente `PredictRequest` e
`ConsumptionDistribution` do Python.

## Decisão

Decidimos introduzir uma **Anti-Corruption Layer (ACL)** entre o ML
Service e o domínio do backend, composta por três elementos:

### 1. Envelope Genérico no Cliente HTTP

O método `MlServiceClient.predict()` passará a retornar um envelope
genérico em vez de um record tipado:

```java
// Novo retorno
public MlEnvelope predict(MlEnvelope request) { ... }

// MlEnvelope é um container simples
public record MlEnvelope(Map<String, Object> body, Map<String, String> metadata) {}
```

Isso elimina o acoplamento do nome dos campos entre o JSON do ML e os
records Java. O client HTTP apenas encaminha o JSON e devolve um
`Map<String, Object>` com a resposta.

### 2. AnalysisMapper para Tradução Envelope → Domínio

Criar um mapper dedicado que sabe extrair do envelope genérico os valores
esperados pelo domínio:

```java
@Component
public class AnalysisMapper {
    private static final String KEY_CATEGORY = "category";
    private static final String KEY_PROBABILITY = "probability";
    private static final String KEY_RECOMMENDATIONS = "recommendations";

    public MlResult toMlResult(MlEnvelope envelope) {
        String category = extractString(envelope, KEY_CATEGORY);
        double probability = extractDouble(envelope, KEY_PROBABILITY);
        List<String> recommendations = extractList(envelope, KEY_RECOMMENDATIONS);
        return new MlResult(category, probability, recommendations);
    }
}
```

As chaves são configuráveis via `application.properties`:

```properties
ml.output.field.category=category
ml.output.field.probability=probability
ml.output.field.recommendations=recommendations
```

### 3. Domain Result Object

Criar um value object `MlResult` no core do domínio para representar o
resultado da análise do ML, desacoplando o domínio da estrutura JSON do
ML Service:

```java
// core/domain/model/MlResult.java
public record MlResult(String category, double probability, List<String> recommendations) {
    public MlResult {
        Objects.requireNonNull(category);
        Objects.requireNonNull(recommendations);
        if (probability < 0.0 || probability > 1.0) {
            throw new IllegalArgumentException("Probability out of range");
        }
    }
}
```

## Alternativas consideradas

| Alternativa | Prós | Contras |
|---|---|---|
| **ACL com envelope genérico (escolhido)** | Desacoplamento total do schema do ML; chaves configuráveis via properties | Perda de tipagem estática no contato com o ML (compensada por validação no mapper) |
| **Codegen do schema OpenAPI do ML** | Tipagem estática mantida | Acoplamento à ferramenta de codegen; toda mudança no ML exige regeneração e commit |
| **GraphQL como camada intermediária** | Contrato flexível por design | Complexidade excessiva para o escopo; infra nova para sustentar |
| **Manter records fixos (atual)** | Simplicidade inicial | Frágil; toda mudança no ML quebra o backend em runtime |

## Consequências

- **Positivo:** O domínio do backend fica isolado de mudanças no schema
  do ML Service.
- **Positivo:** Mudanças de nome de campo no ML viram apenas alteração de
  config (properties), sem necessidade de compilar o backend.
- **Positivo:** Facilita testes: o `MlResult` é um POJO simples, sem
  dependência externa.
- **Negativo:** Perda da validação automática de tipos do Spring/Jackson
  no contato com o ML (compensada por validação explícita no mapper).
- **Negativo:** Necessidade de documentar as chaves esperadas em cada
  ambiente.
