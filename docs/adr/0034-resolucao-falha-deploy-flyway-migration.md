# ADR-0034: Resolução de Falha no Deploy por Migration Flyway corrompida

## Status

Aceito

## Contexto

O deploy do backend começou a falhar após a introdução da migration V12, que adiciona aparelhos da categoria "Serviços" ao catálogo. A migration foi criada com a ordem errada das operações SQL: os comandos `INSERT` foram executados antes de dropar a `CHECK constraint`, fazendo com que a constraint existente (`chk_appliance_category`) bloqueasse a inserção dos registros com categoria "Serviços" (que não estava entre os valores permitidos na constraint original).

O erro resultou em uma migration V12 corrompida no banco de dados (registrada como `success: 0` na tabela `flyway_schema_history`), impedindo qualquer execução futura do Flyway.

## Causa Raiz

A migration V12 foi criada com a seguinte ordem incorreta:

```
1. INSERT (falhou - CHECK constraint bloqueava 'Serviços')
2. DROP CONSTRAINT
3. ADD CONSTRAINT
```

A ordem correta deveria ser:

```
1. DROP CONSTRAINT
2. INSERT
3. ADD CONSTRAINT (incluindo 'Serviços')
```

Além disso, o `application.properties` não tinha mapeamento para a variável `spring.flyway.clean-on-validation-error`, e o Spring Boot define `spring.flyway.clean-disabled=true` como padrão, impossibilitando a recuperação automática via Flyway.

## Processo de Resolução

### Primeira tentativa: spring.flyway.clean-on-validation-error

Adicionou-se a propriedade `spring.flyway.clean-on-validation-error=true` ao `application.properties`, que deveria limpar o schema automaticamente ao detectar a migration com falha. Porém, não funcionou porque:

- A propriedade não estava mapeada no `application.properties`, portanto definir a env var `SPRING_FLYWAY_CLEAN_ON_VALIDATION_ERROR` no Render era ignorada
- Mesmo depois de adicionar a propriedade, o Spring Boot define `spring.flyway.clean-disabled=true` por padrão, que bloqueia qualquer operação de clean

### Segunda tentativa: spring.flyway.clean-disabled=false

Adicionou-se `spring.flyway.clean-disabled=false` em conjunto com `clean-on-validation-error=true`. Ainda não funcionou — possivelmente por limitações do Flyway 12.4.0 na interação entre essas duas propriedades ou por incompatibilidade com a versão do Spring Boot (4.1.0).

### Terceira tentativa: Desabilitar Flyway e usar Hibernate

Temporariamente desabilitou-se o Flyway (`spring.flyway.enabled=false`) e configurou-se o Hibernate com `ddl-auto=update` para gerenciar o schema. Essa abordagem permitiria ao menos iniciar o aplicativo. Porém, não resolveu porque a env var `SPRING_FLYWAY_ENABLED=true` no Render sobrescrevia a configuração do properties.

### Quarta tentativa: Deleção manual da entrada corrompida

A entrada da V12 na tabela `flyway_schema_history` foi deletada manualmente via SQL no banco Oracle:

```sql
DELETE FROM "flyway_schema_history" WHERE "version" = '12';
COMMIT;
```

Após a deleção, restaurou-se a configuração original do Flyway no `application.properties` e reativou-se o Flyway no Render (`SPRING_FLYWAY_ENABLED=true`).

### Quinta tentativa: Erro de baseline

Com o banco vazio (após drop manual de todas as tabelas), o Flyway tentou fazer baseline mas falhou porque a env var `SPRING_FLYWAY_BASELINE_VERSION` não estava configurada no Render. O placeholder `${SPRING_FLYWAY_BASELINE_VERSION}` no `application.properties` não pôde ser resolvido, resultando no erro:

```
Invalid version: ${SPRING.FLYWAY.BASELINE.VERSION}
```

### Solução Final

Adicionaram-se valores padrão às propriedades do Flyway usando a sintaxe `${VAR:default}`:

```properties
spring.flyway.baseline-on-migrate=${SPRING_FLYWAY_BASELINE_ON_MIGRATE:false}
spring.flyway.baseline-version=${SPRING_FLYWAY_BASELINE_VERSION:0}
```

O valor `baseline-version=0` é crítico: se o `baseline-on-migrate` estiver ativo, o Flyway marca a versão 0 como baseline e executa todas as migrations com versão superior (V1, V2, ..., V12). Com `baseline-version=1`, a migration V1 (que cria o schema inicial) seria pulada, causando falha nas migrations seguintes.

## Commits envolvidos

| Commit | Descrição |
|---|---|
| `f6dcd3f` | Corrige ordem da V12: DROP CONSTRAINT antes de INSERT |
| `35ff7b6` | Adiciona `clean-on-validation-error=true` |
| `57cbb4a` | Comentário TODO na propriedade temporária |
| `98acebc` | Desabilita Flyway temporariamente + Hibernate create-drop |
| `7f237ef` | Muda para Hibernate update (preserva dados V1-V11) |
| `f8a863e` | Restaura config original do Flyway |
| `709f725` | Adiciona defaults para baseline Flyway |
| `a749de3` | Muda baseline-version para 0 |

## Prevenção

1. **Sempre validar a ordem das operações SQL em migrations**: operações DDL (como DROP CONSTRAINT) devem vir antes de DML (INSERT) quando há dependência de constraints
2. **Usar `${VAR:default}`** em todas as propriedades de configuração para evitar falhas quando env vars não estão definidas
3. **Documentar env vars obrigatórias** no `.env.example` e na documentação do projeto
4. **Em desenvolvimento, manter `spring.flyway.clean-disabled=false`** para permitir reparos manuais via Flyway
