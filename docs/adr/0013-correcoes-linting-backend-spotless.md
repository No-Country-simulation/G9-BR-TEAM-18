# ADR-0013: Correções de Linting no Backend - Spotless/Checkstyle

## Status

Aceito

## Contexto

A pipeline de CI do projeto inclui verificações obrigatórias de formatação via Spotless
(Palantir Java Format) e qualidade via Checkstyle. Após a implementação dos cards B020-B023
e I010, novas violações de formatação foram introduzidas nos arquivos:

- `AuthController.java` - indentação do método `resetPassword` estava fora do padrão
  Palantir (quebra de linha incorreta)
- `AuthenticationServiceTest.java` - chamadas de `assertThrows` com quebra de linha
  inadequada

O CI `lint-backend` falhou com erro do Spotless, impedindo o merge do PR.

## Decisão

A equipe decidiu executar `mvn spotless:apply` via Docker (imagem `eclipse-temurin:21-jdk`)
para corrigir automaticamente todas as violações de formatação, em vez de editar
manualmente os arquivos. O comando executado foi:

```bash
docker run --rm -v "$(pwd):/app" -w /app \
  eclipse-temurin:21-jdk \
  ./mvnw spotless:apply
```

Nenhuma alteração de lógica foi feita - apenas formatação.

## Alternativas consideradas

| Alternativa | Prós | Contras |
|---|---|---|
| **Spotless:apply via Docker (escolhido)** | Garante mesma JDK do CI, resultado determinístico | Requer Docker instalado |
| **Edição manual** | Sem dependência de ferramentas | Propenso a erro humano; Palantir tem regras de quebra de linha não intuitivas |

## Consequências

- **Positivo:** Formatação 100% consistente com o que o CI espera
- **Positivo:** Uso do Docker elimina diferenças entre JDK local e do CI
- **Neutro:** Desenvolvedores precisam executar `./mvnw spotless:apply` antes de commitar
  (já documentado no AGENTS.md)
