# ADR-0038: Correção da V14 — PL/SQL para constraints inline sem nome no Oracle

## Status

Aceito

## Contexto

A migration V14 (`V14__align_analysis_status.sql`) foi criada para alinhar a CHECK constraint de status da tabela `tb_energy_analysis` com o frontend, substituindo os valores antigos (`PENDENTE`, `PROCESSADO`, `FALHA`, `FINALIZADO`) pelos novos (`PENDENTE`, `CONCLUIDA`, `FALHA`).

A primeira versão da V14 tentou dropar a constraint pelo nome `chk_analysis_status`:

```sql
ALTER TABLE tb_energy_analysis DROP CONSTRAINT chk_analysis_status;
```

Isso falhou com `ORA-02443: Cannot drop constraint - nonexistent constraint` porque a constraint original foi criada na migration V1 **inline sem nome explícito**:

```sql
status VARCHAR2(20) NOT NULL
    CHECK (status IN ('PENDENTE', 'PROCESSADO', 'FALHA', 'FINALIZADO')),
```

No Oracle, constraints inline sem nome recebem um nome gerado pelo sistema (`SYS_Cnnnnnn`), que não pode ser referenciado diretamente.

## Causa Raiz

A migration V1 (`V1__initial_schema.sql`) define a CHECK constraint de status como uma constraint **inline na definição da coluna**, sem usar `CONSTRAINT chk_analysis_status` como nome explícito. Diferentemente das constraints em V3 (que usam `ALTER TABLE ... ADD CONSTRAINT chk_property_type` com nome explícito), a constraint inline em V1 é anônima para o Oracle.

## Primeira Tentativa de Correção (PL/SQL com user_cons_columns)

A primeira correção substituiu o `DROP CONSTRAINT` fixo por um bloco PL/SQL que consultava `user_constraints` + `user_cons_columns` para encontrar a constraint pelo nome da coluna:

```sql
SELECT c.constraint_name INTO v_constraint_name
FROM user_constraints c
JOIN user_cons_columns cc
  ON c.constraint_name = cc.constraint_name
WHERE c.table_name = 'TB_ENERGY_ANALYSIS'
  AND c.constraint_type = 'C'
  AND cc.column_name = 'STATUS';
```

Isso falhou com `ORA-01422: exact fetch returns more than requested number of rows` porque no Oracle o `NOT NULL` também é armazenado como uma CHECK constraint (`constraint_type = 'C'`). A coluna `STATUS` tem tanto a constraint NOT NULL quanto a CHECK de valores, e ambas aparecem em `user_cons_columns` com `column_name = 'STATUS'`.

## Segunda Tentativa (ALTER TABLE MODIFY — DESCARTA DA)

Uma abordagem alternativa usando `ALTER TABLE MODIFY` com `CONSTRAINT` foi considerada:

```sql
ALTER TABLE tb_energy_analysis MODIFY status VARCHAR2(20)
    CONSTRAINT chk_analysis_status CHECK (status IN ('PENDENTE', 'CONCLUIDA', 'FALHA'));
```

Esta abordagem foi **descartada** porque o Oracle **adiciona** a nova constraint sem remover a antiga, resultando em duas constraints concorrentes na mesma coluna. O valor `CONCLUIDA` seria rejeitado pela constraint antiga, efetivamente quebrando a aplicação.

## Decisão Final

Usar `search_condition_vc` na consulta para encontrar a constraint pelo **conteúdo da condição**, filtrando especificamente a constraint com os valores antigos:

```sql
DECLARE
    v_constraint_name VARCHAR2(30);
BEGIN
    SELECT c.constraint_name INTO v_constraint_name
    FROM user_constraints c
    WHERE c.table_name = 'TB_ENERGY_ANALYSIS'
      AND c.constraint_type = 'C'
      AND c.search_condition_vc LIKE '%PENDENTE%PROCESSADO%FALHA%FINALIZADO%';

    EXECUTE IMMEDIATE 'ALTER TABLE tb_energy_analysis DROP CONSTRAINT '
        || v_constraint_name;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        NULL;
    WHEN TOO_MANY_ROWS THEN
        FOR r IN (
            SELECT c.constraint_name
            FROM user_constraints c
            WHERE c.table_name = 'TB_ENERGY_ANALYSIS'
              AND c.constraint_type = 'C'
              AND c.search_condition_vc LIKE '%PENDENTE%PROCESSADO%FALHA%FINALIZADO%'
        ) LOOP
            EXECUTE IMMEDIATE 'ALTER TABLE tb_energy_analysis DROP CONSTRAINT '
                || r.constraint_name;
        END LOOP;
END;
/

ALTER TABLE tb_energy_analysis ADD CONSTRAINT chk_analysis_status
    CHECK (status IN ('PENDENTE', 'CONCLUIDA', 'FALHA'));
```

### Por que search_condition_vc funciona

A coluna `search_condition_vc` (disponível desde Oracle 12c) armazena o texto da condição da constraint. Para a constraint de status, o valor é algo como:

```
status IN ('PENDENTE', 'PROCESSADO', 'FALHA', 'FINALIZADO')
```

Enquanto para a constraint NOT NULL, o valor é:

```
"STATUS" IS NOT NULL
```

O padrão `LIKE '%PENDENTE%PROCESSADO%FALHA%FINALIZADO%'` é específico o suficiente para corresponder apenas à constraint de valores, excluindo a NOT NULL.

### Tratamento de erros

- **NO_DATA_FOUND**: A constraint já foi removida em execução anterior. Segue para adicionar a nova.
- **TOO_MANY_ROWS**: Medida de segurança caso haja múltiplas constraints com o mesmo padrão. Itera sobre todas e remove cada uma.

## Aprendizados

1. **Constraints inline sem nome**: No Oracle, constraints definidas inline na coluna (ex: `CHECK (status IN (...))`) não podem ser referenciadas por nome. Sempre usar `CONSTRAINT nome` explícito ou `ALTER TABLE ... ADD CONSTRAINT`.
2. **NOT NULL como CHECK**: No Oracle, a constraint NOT NULL é armazenada como CHECK constraint (`constraint_type = 'C'`), aparecendo em consultas ao `user_cons_columns`.
3. **ALTER TABLE MODIFY não substitui**: `ALTER TABLE MODIFY` com `CONSTRAINT` adiciona uma nova constraint, não substitui a existente. Isso criaria constraints conflitantes.
4. **search_condition_vc**: É a maneira correta de distinguir CHECK constraints com base no conteúdo da condição.

## Commits

| Commit | Descrição |
|---|---|
| `e65a6c6` | V14: PL/SQL com search_condition_vc para localizar constraint inline sem nome |

## Cards relacionados

| ID | Título |
|---|---|
| F053 | Backend - Alinhar status análise: FINALIZADO -> CONCLUIDA |
