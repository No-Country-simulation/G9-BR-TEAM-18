# ADR-0035: Correção da CHECK constraint chk_property_type para incluir APARTAMENTO

## Status

Aceito

## Contexto

O enum `PropertyType.java` e o frontend já suportavam três valores para o tipo de imóvel: `RESIDENCIAL`, `APARTAMENTO` e `COMERCIAL`. No entanto, a CHECK constraint `chk_property_type` na tabela `tb_property`, criada na migration V3, só permitia os valores `'RESIDENCIAL'` e `'COMERCIAL'`.

Quando um usuário selecionava "Apartamento" no frontend e tentava salvar o perfil, o backend enviava `property_type = 'APARTAMENTO'` para o banco Oracle, que rejeitava a operação com o erro:

```text
A operação viola uma restrição de dados. (HTTP 409)
```

Este erro era genérico, capturado pelo `GlobalExceptionHandler` ao interceptar `DataIntegrityViolationException`, sem indicar qual constraint específica havia sido violada.

## Causa Raiz

A migration V3 (`V3__add_residential_appliances.sql`) foi criada em um momento em que o projeto usava apenas dois tipos de imóvel: `RESIDENCIAL` e `COMERCIAL`. Posteriormente, o tipo `APARTAMENTO` foi adicionado ao enum e ao frontend (card F047), mas a constraint no banco nunca foi atualizada para refletir essa mudança.

Além disso, o DTO `PropertyRequestDTO.java` também estava desatualizado - o `@Schema` `allowableValues` só listava `{"RESIDENCIAL", "COMERCIAL"}`, gerando documentação Swagger incorreta.

## Decisão

Criar a migration V13 para dropar e recriar a constraint `chk_property_type` com os três valores válidos:

```sql
ALTER TABLE tb_property DROP CONSTRAINT chk_property_type;
ALTER TABLE tb_property ADD CONSTRAINT chk_property_type
    CHECK (property_type IN ('RESIDENCIAL', 'APARTAMENTO', 'COMERCIAL'));
```

E atualizar o DTO `PropertyRequestDTO.java` para listar `"APARTAMENTO"` no `allowableValues` do Swagger.

## Commits

| Commit | Descrição |
|---|---|
| `eb3298d` | V13 migration + PropertyRequestDTO Swagger |

## Cards relacionados

| ID | Título |
|---|---|
| F047 | Frontend - Adicionar Apartamento como tipo de imóvel (introduziu o valor sem atualizar a constraint) |
| F052 | Backend - Corrigir CHECK constraint chk_property_type para incluir APARTAMENTO |

## Prevenção

1. **Sempre verificar constraints do banco** ao adicionar novos valores a enums que são persistidos no banco
2. **Manter Swagger (`allowableValues`) sincronizado** com os valores reais dos enums
3. **Adicionar testes de integração** que validem a persistência de todos os valores de um enum
