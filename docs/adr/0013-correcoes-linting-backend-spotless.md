# ADR-0013: Correcoes de Linting no Backend - Spotless/Checkstyle

## Status

Aceito

## Contexto

A pipeline de CI do projeto inclui verificacoes obrigatorias de formatacao via Spotless
(Palantir Java Format) e qualidade via Checkstyle. Apos a implementacao dos cards B020-B023
e I010, novas violacoes de formatacao foram introduzidas nos arquivos:

- `AuthController.java` - indentacao do metodo `resetPassword` estava fora do padrao
  Palantir (quebra de linha incorreta)
- `AuthenticationServiceTest.java` - chamadas de `assertThrows` com quebra de linha
  inadequada

O CI `lint-backend` falhou com erro do Spotless, impedindo o merge do PR.

## Decisao

A equipe decidiu executar `mvn spotless:apply` via Docker (imagem `eclipse-temurin:21-jdk`)
para corrigir automaticamente todas as violacoes de formatacao, em vez de editar
manualmente os arquivos. O comando executado foi:

```bash
docker run --rm -v "$(pwd):/app" -w /app \
  eclipse-temurin:21-jdk \
  ./mvnw spotless:apply
```

Nenhuma alteracao de logica foi feita - apenas formatacao.

## Alternativas consideradas

| Alternativa | Pros | Contras |
|---|---|---|
| **Spotless:apply via Docker (escolhido)** | Garante mesma JDK do CI, resultado deterministico | Requer Docker instalado |
| **Edicao manual** | Sem dependencia de ferramentas | Propenso a erro humano; Palantir tem regras de quebra de linha nao intuitivas |

## Consequencias

- **Positivo:** Formatacao 100% consistente com o que o CI espera
- **Positivo:** Uso do Docker elimina diferencas entre JDK local e do CI
- **Neutro:** Desenvolvedores precisam executar `./mvnw spotless:apply` antes de commitar
  (ja documentado no AGENTS.md)
