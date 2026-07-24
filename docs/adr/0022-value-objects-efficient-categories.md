# ADR-0022: Value Objects de Domínio para Categorias de Eficiência

## Status

Aceito

## Contexto

As categorias de eficiência energética (`EXCELENTE`, `BOM`, `MEDIANO`,
`RUIM`, `CRITICO`) são representadas como `String` em todo o código do
domínio:

- `EnergyAnalysis.category` é `String`
- `AnalysisResponseDTO.category` é `String`
- A validação é feita por comparação de strings em
  `EnergyAnalysisService.normalizeCategory()`
- No frontend, `EfficiencyClassification` é um type union de strings

Isso traz os seguintes problemas:

1. **Validação dispersa:** cada camada valida as categorias à sua
   maneira, com risco de inconsistências.
2. **Sem semântica de domínio:** uma `String` não comunica a intenção --
   qualquer string arbitrária pode ser atribuída.
3. **Dificuldade de evolução:** adicionar ou remover uma categoria exige
   busca em todo o código fonte.

## Decisão

Decidimos criar um **Value Object** `EfficiencyCategory` no core do
domínio (camada `core/domain/`) para representar as categorias de
eficiência energética com encapsulamento e validação.

### 1. Value Object no Core do Domínio

```java
package br.com.group18.energiai.core.domain.valueobject;

public record EfficiencyCategory(String value) {
    private static final Set<String> VALID = Set.of(
        "EXCELENTE", "BOM", "MEDIANO", "RUIM", "CRITICO"
    );

    public EfficiencyCategory {
        Objects.requireNonNull(value, "category must not be null");
        String normalized = value.trim().toUpperCase();
        if (!VALID.contains(normalized)) {
            throw new IllegalArgumentException(
                "Invalid category: " + value + ". Valid: " + VALID
            );
        }
    }

    @Override
    public String toString() {
        return value;
    }
}
```

### 2. Atualização do Modelo de Domínio

`EnergyAnalysis.category` passa de `String` para `EfficiencyCategory`:

```java
public class EnergyAnalysis {
    private EfficiencyCategory category;
    // ...
}
```

### 3. Mapper para Adaptação entre Camadas

O `AnalysisMapper` (criado no ADR-0020) será responsável por converter a
string vinda do ML Service para `EfficiencyCategory`:

```java
EfficiencyCategory cat = new EfficiencyCategory(envelope.category());
```

### 4. Serialização Jackson

Configurar um serializador/desserializador Jackson para
`EfficiencyCategory` para que a API continue aceitando e retornando
strings:

```java
@JsonValue
public String toJson() { return value; }
```

### 5. Frontend: Type Alias com Base no Backend

O frontend continuará usando um tipo, mas agora esse tipo pode ser
derivado dinamicamente:

```typescript
// Mantido como type alias, mas populado dinamicamente via API
type EfficiencyCategory = string; // validado pelo backend
```

## Alternativas consideradas

| Alternativa | Prós | Contras |
|---|---|---|
| **Value Object EfficiencyCategory (escolhido)** | Encapsulamento, validação centralizada, semântica de domínio | Mais código que String pura; requer serialização customizada |
| **Enum Java** | Tipagem forte, valores conhecidos em compile-time | Não permite adição dinâmica via schema discovery sem recompilar |
| **String com constantes** | Simples | Não impede valores inválidos; sem encapsulamento |
| **String validada por anotação (@Pattern)** | Validação na borda da API | Validação apenas no controller, não no domínio |

## Consequências

- **Positivo:** Categorias são validadas uma única vez no construtor do
  Value Object, eliminando validação dispersa.
- **Positivo:** O domínio ganha semântica -- `EfficiencyCategory` comunica
  intenção e pode ser estendida com métodos (ex: `isCritical()`).
- **Positivo:** Compatibilidade com schema discovery (ADR-0021): o
  conjunto `VALID` pode ser populado dinamicamente.
- **Negativo:** Requer mapeamento adicional (Jackson serializer/
  desserializer) para serialização JSON.
- **Negativo:** Pequeno aumento de boilerplate no código.
