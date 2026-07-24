# ADR-0023: Estratégia de Testes de Contrato para Integração ML

## Status

Aceito

## Contexto

Atualmente, não há nenhuma verificação automatizada que detecte quando o
ML Service altera seu contrato (request, response, categorias válidas). As
consequências incluem:

1. **Quebras silenciosas:** se o ML renomear um campo, o backend recebe
   `null` ou lança exceção em runtime.
2. **Detecção tardia:** o problema é descoberto apenas em testes de
   integração ou, pior, em produção.
3. **Sem rastreabilidade:** não há registro da versão do contrato do ML
   que cada deploy do backend espera.

## Decisão

Decidimos implementar uma estratégia de **Testes de Contrato** em dois
níveis, seguindo o padrão Consumer-Driven Contracts (CDC) adaptado para
arquitetura síncrona HTTP.

### Nível 1: Teste de Compatibilidade de Schema (Backend)

Um teste de integração que, no contexto de teste (`@SpringBootTest`),
consulta o endpoint `/predict-schema` do ML Service e valida se os
campos que o backend utiliza ainda existem no schema:

```java
@Test
void mlSchemaShouldContainExpectedFields() {
    var schema = mlTestClient.fetchSchema();
    assertThat(schema)
        .containsKey("category")
        .containsKey("probability")
        .containsKey("recommendations");
}
```

Se o ML remover ou renomear um campo esperado, o teste quebra com uma
mensagem clara sobre o que mudou.

### Nível 2: Teste de Categorias Válidas (Backend)

Um teste que valida se as categorias retornadas pelo ML Service são
compatíveis com as esperadas pelo domínio:

```java
@Test
void mlCategoriesShouldBeCompatibleWithValueObject() {
    var categories = mlTestClient.fetchCategories();
    for (String cat : categories) {
        // Deve ser possível instanciar o Value Object
        assertDoesNotThrow(() -> new EfficiencyCategory(cat));
    }
}
```

Isso garante que toda categoria que o ML retorna é aceita pelo Value
Object `EfficiencyCategory` (ADR-0022).

### Nível 3: Teste de Contrato no CI

Os testes de contrato serão executados no GitHub Actions como parte do
workflow de CI do backend:

```yaml
# .github/workflows/contract-tests.yml (novo)
name: Contract Tests
on:
  pull_request:
    paths:
      - 'ml-service/**'
      - 'backend/**'
jobs:
  contract-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Start ML Service
        run: docker compose up -d ml-service
      - name: Wait for ML Service
        run: ./scripts/wait-for-ml.sh
      - name: Run contract tests
        run: ./mvnw test -pl backend -Dtest="*ContractTest"
```

Isso garante que, em todo PR que mexa no ML Service ou no backend, os
testes de contrato validem a compatibilidade antes do merge.

### Nível 4: Versionamento de Contrato (Futuro)

Para o médio prazo, cada resposta do ML Service incluirá a versão do
contrato:

```python
class PredictResponse(BaseModel):
    category: str
    probability: float
    recommendations: list[str]
    source: str = ""
    contract_version: str = "2.0.0"
```

O backend poderá registrar a versão esperada e alertar se houver
diferença.

## Alternativas consideradas

| Alternativa | Prós | Contras |
|---|---|---|
| **Testes de contrato CDC (escolhido)** | Detecção precoce de quebras; execução no CI | Dependência do ML Service no ambiente de teste |
| **Pact (ferramenta CDC)** | Protocolo maduro para CDC | Overhead de setup; learning curve |
| **Apenas testes de integração E2E** | Cobertura geral | Não isolam problemas de contrato; mais lentos |
| **Não testar contrato (atual)** | Zero esforço | Quebras silenciosas em runtime |

## Consequências

- **Positivo:** Qualquer mudança no contrato do ML Service é detectada
  em segundos no CI, antes de chegar a produção.
- **Positivo:** Testes são rápidos (segundos) por não exigirem banco de
  dados ou frontend.
- **Positivo:** Servem como documentação viva do contrato esperado.
- **Negativo:** Exigem que o ML Service esteja rodando no ambiente de
  teste (Docker Compose ou serviço mockado).
- **Negativo:** Testes precisam ser mantidos em sincronia com a lógica do
  mapper (ADR-0020).
