# ADR-0048: Sincronização do Catálogo ML com o Banco de Dados (B052)

## Status

Aceito (com correção pendente - B053)

> **Nota (01/08/2026):** o deploy do Render quebrou no startup com `ORA-02290:
> check constraint (ADMIN.CHK_APPLIANCE_CATEGORY) violated` no
> `ApplianceCatalogSyncService`. O sync grava o `mlCategory` do ML em inglês
> (`REFRIGERATION`, `CLIMATE_CONTROL`, ...) em `tb_appliance.appliance_category`,
> mas a constraint `chk_appliance_category` (migration V12) só aceita os valores
> em português (`'Iluminação'`, `'Refrigeração'`, `'Climatização'`,
> `'Eletrodomésticos'`, `'Tecnologia'`, `'Serviços'`). Correção rastreada no card
> **B053** (#152): mapear `mlCategory` -> português via `EquipmentCategory.toPortuguese()`
> antes do save, mantendo o contrato `GET /appliances` em inglês (ADR-0027).

## Contexto

O frontend consome `GET /appliances` como única fonte do catálogo de eletrodomésticos (ADR-0047). No entanto, o fluxo de salvar aparelhos no perfil (batch update) exige um `appliance_id` real válido no banco de dados (`tb_appliance`).
Como o catálogo vinha diretamente do ML Service (em memória), ele não possuía o campo `id`. O frontend tentava usar um fallback (slugify), o que quebrava o fluxo resultando em `ResourceNotFoundException`.

## Decisão

Implementar a sincronização (Upsert) do catálogo do ML Service com o banco de dados da aplicação sempre que o sistema é iniciado, e expor o ID real no endpoint.

### Detalhes da Implementação

1. **ApplianceCatalogSyncService:** Um listener rodando no startup (`@EventListener(ApplicationReadyEvent.class)`) que lê o catálogo em memória.
2. **Upsert Idempotente:** O serviço compara os itens do ML com a tabela `tb_appliance`. Se o aparelho não existir, é inserido; se existir, os valores de potência e horas são atualizados.
3. **Normalização de Nomes:** Implementada a classe utilitária `ApplianceNameNormalizer` (NFD + lowercase + trim) para o match entre o ML e o banco, evitando duplicação (ex: "Lâmpada" vs "lampada led").
4. **Endpoint Refatorado:** `GET /appliances` passou a buscar os dados diretamente do `ApplianceRepositoryPort` (banco de dados), mapeando para o `ApplianceResponseDTO` enriquecido com o campo `id`.
5. **Ajuste de Contrato (Batch Update):** Adicionado o mapeamento `@JsonProperty("appliance_id")` no DTO `ApplianceQuantity` para suportar o snake_case enviado pelo frontend.

## Alternativas consideradas

- **Servir catálogo direto do banco (sem sync):** Perderia a descoberta dinâmica do ML Service. Rejeitada.
- **Match por nome request a request:** Deixaria os itens novos do ML sem ID, além de onerar a performance. Rejeitada.

## Consequências

- **Positivo:** Fluxo de salvar aparelhos no frontend totalmente destravado (resolve bloqueio da ADR-0047).
- **Positivo:** Descoberta dinâmica do ML Service mantida e agora com persistência física, garantindo integridade referencial.
- **Positivo:** Mapeamento correto de `snake_case` para `camelCase` estabelecido para o batch update.
- **Negativo:** Requer sincronização e conversão de dados (`BigDecimal` para tipos primitivos) no startup, adicionando uma leve complexidade na inicialização da aplicação.
